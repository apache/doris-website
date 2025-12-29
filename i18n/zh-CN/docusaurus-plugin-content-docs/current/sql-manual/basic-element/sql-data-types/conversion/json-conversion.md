---
{
    "title": "转换为/从 JSON 类型",
    "language": "zh-CN",
    "description": "Doris 中的 JSON 类型采用二进制编码存储，而不是文本存储，提供更高效的处理和存储方式。JSON 类型与 Doris 内部类型存在一一对应的关系。"
}
---

Doris 中的 JSON 类型采用二进制编码存储，而不是文本存储，提供更高效的处理和存储方式。JSON 类型与 Doris 内部类型存在一一对应的关系。

## 转换为 JSON

### FROM String

当将字符串转换为 JSON 时，字符串内容必须符合 [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159) 定义的有效 JSON 语法。解析器会验证字符串并将其转换为相应的 JSON 二进制格式。

#### 字符串解析规则

- 如果字符串包含有效的 JSON 结构（对象、数组、数字、布尔值或 null），将解析为对应的 JSON 类型：
  ```sql
  mysql> SELECT CAST('[1,2,3,4]' AS JSON); -- 输出：[1,2,3,4]（解析为 JSON 数组）
  +---------------------------+
  | CAST('[1,2,3,4]' AS JSON) |
  +---------------------------+
  | [1,2,3,4]                 |
  +---------------------------+
  ```

- 要创建 JSON 字符串值（将字符串本身视为 JSON 字符串值而不是解析它），请使用 `TO_JSON` 函数：
  ```sql
  mysql> SELECT TO_JSON('[1,2,3,4]'); -- 输出："[1,2,3,4]"（带引号的 JSON 字符串）
  +----------------------+
  | TO_JSON('[1,2,3,4]') |
  +----------------------+
  | "[1,2,3,4]"          |
  +----------------------+
  ```

#### 数字解析规则

从 JSON 字符串解析数值时：

- 如果数字包含小数点，将转换为 JSON Double 类型：
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key');
  +------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key')   |
  +------------------------------------------------------+
  | double                                               |
  +------------------------------------------------------+
  ```

- 如果数字是整数形式，将存储为最小兼容整数类型：
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key');
  +---------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key')   |
  +---------------------------------------------------------+
  | int                                                     |
  +---------------------------------------------------------+
  ```

  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key');
  +-------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key')   |
  +-------------------------------------------------------------+
  | bigint                                                      |
  +-------------------------------------------------------------+
  ```

- 特别地，如果整数超出 Int128 范围，会使用 double 类型存储，这时会丢失精度：
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key');
  +--------------------------------------------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key')   |
  +--------------------------------------------------------------------------------------------------+
  | double                                                                                           |
  +--------------------------------------------------------------------------------------------------+
  ```

#### 错误处理

将字符串解析为 JSON 时：
- 在严格模式（默认）下，无效的 JSON 语法会导致错误
- 在非严格模式下，无效的 JSON 语法会返回 NULL

```sql
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
+-----------------------------+
| CAST('{"invalid JSON' AS JSON) |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> SET enable_strict_cast = true;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Failed to parse json string: {"invalid JSON, ...
```

### FROM 其他 Doris 类型

以下 Doris 类型可以直接转换为 JSON 而不丢失精度：

| Doris 类型 | JSON 类型 |
|------------|-----------|
| BOOLEAN | Bool |
| TINYINT | Int8 |
| SMALLINT | Int16 |
| INT | Int32 |
| BIGINT | Int64 |
| LARGEINT | Int128 |
| FLOAT | Float |
| DOUBLE | Double |
| DECIMAL | Decimal |
| STRING | String |
| ARRAY | Array |
| STRUCT | Object |

#### 示例

```sql
-- 整数数组转 JSON
mysql> SELECT CAST(ARRAY(123,456,789) AS JSON);
+----------------------------------+
| CAST(ARRAY(123,456,789) AS JSON) |
+----------------------------------+
| [123,456,789]                    |
+----------------------------------+

-- Decimal 数组转 JSON（保留原始精度）
mysql> SELECT CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON);
+--------------------------------------------------------------------------+
| CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON)  |
+--------------------------------------------------------------------------+
| [12345678.123456780000000000,0.000000010000000000,12.000000000000000001] |
+--------------------------------------------------------------------------+
```

#### 不直接支持的类型

上表中未列出的类型不能直接转换为 JSON：

```sql
mysql> SELECT CAST(MAKEDATE(2021, 1) AS JSON);
ERROR 1105 (HY000): CAST AS JSONB can only be performed between JSONB, String, Number, Boolean, Array, Struct types. Got Date to JSONB
```

解决方案：先转换为兼容类型，再转为 JSON：

```sql
mysql> SELECT CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON);
+---------------------------------------------------+
| CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON)   |
+---------------------------------------------------+
| 20210101                                          |
+---------------------------------------------------+
```

## 从 JSON 转换


:::caution 行为变更
在 4.0 版本之前，Doris 对 JSON CAST 的行为比较宽松，不会处理溢出行为。

从 4.0 版本开始，在 JSON CAST 中出现溢出行为，在严格模式下报错，非严格模式下返回 NULL。
:::

### TO Boolean

JSON Bool、Number 和 String 类型可以转换为 BOOLEAN：

```sql
-- 从 JSON Bool 转换
mysql> SELECT CAST(CAST('true' AS JSON) AS BOOLEAN);
+---------------------------------------+
| CAST(CAST('true' AS JSON) AS BOOLEAN) |
+---------------------------------------+
|                                     1 |
+---------------------------------------+

-- 从 JSON Number 转换
mysql> SELECT CAST(CAST('123' AS JSON) AS BOOLEAN);
+--------------------------------------+
| CAST(CAST('123' AS JSON) AS BOOLEAN) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+

-- 从 JSON String 转换（必须包含有效的布尔值表示）
mysql> SELECT CAST(TO_JSON('true') AS BOOLEAN);
+----------------------------------+
| CAST(TO_JSON('true') AS BOOLEAN) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

### TO 数值类型

JSON Bool、Number 和 String 类型可以转换为数值类型（TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL）：

```sql
-- 从 JSON Number 转换为 INT
mysql> SELECT CAST(CAST('123' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('123' AS JSON) AS INT) |
+----------------------------------+
|                              123 |
+----------------------------------+

-- 从 JSON Bool 转换为数值类型
mysql> SELECT CAST(CAST('true' AS JSON) AS INT), CAST(CAST('false' AS JSON) AS DOUBLE);
+-----------------------------------+--------------------------------------+
| CAST(CAST('true' AS JSON) AS INT) | CAST(CAST('false' AS JSON) AS DOUBLE) |
+-----------------------------------+--------------------------------------+
|                                 1 |                                    0 |
+-----------------------------------+--------------------------------------+
```

当转换为较小类型时，适用数值溢出规则：

```sql
-- 在严格模式下，溢出会导致错误
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
ERROR 1105 (HY000): Cannot cast from jsonb value type 12312312312312311 to doris type INT

-- 在非严格模式下，溢出返回 NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
+-----------------------------------------+
| CAST(TO_JSON(12312312312312311) AS INT) |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

### TO String

任何 JSON 类型都可以转换为 STRING，生成 JSON 文本表示：

```sql
mysql> SELECT CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING);
+----------------------------------------------------------+
| CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING) |
+----------------------------------------------------------+
| {"key1":"value1","key2":123}                             |
+----------------------------------------------------------+

mysql> SELECT CAST(CAST('true' AS JSON) AS STRING);
+--------------------------------------+
| CAST(CAST('true' AS JSON) AS STRING) |
+--------------------------------------+
| true                                 |
+--------------------------------------+
```

### TO Array

JSON Array , String 类型可以转换为 Doris ARRAY 类型：

```sql
mysql> SELECT CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>);
+-------------------------------------------+
| CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>) |
+-------------------------------------------+
| [1, 2, 3]                                 |
+-------------------------------------------+

-- 数组元素内的类型转换
mysql> SELECT CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>);
+-------------------------------------------------+
| CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>) |
+-------------------------------------------------+
| [1, 2, 3]                                       |
+-------------------------------------------------+

-- 把字符串转换成数组
mysql> SELECT CAST(TO_JSON("['123','456']") AS ARRAY<INT>);
+----------------------------------------------+
| CAST(TO_JSON("['123','456']") AS ARRAY<INT>) |
+----------------------------------------------+
| [123, 456]                                   |
+----------------------------------------------+
```

数组中的元素按标准转换规则单独转换：

```sql
-- 在非严格模式下，无效元素变为 NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
+---------------------------------------------------+
| CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>) |
+---------------------------------------------------+
| [10, 20, null]                                    |
+---------------------------------------------------+

-- 在严格模式下，无效元素导致错误
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
ERROR 1105 (HY000): Cannot cast from jsonb value type 200 to doris type TINYINT
```

### TO Struct

JSON Object，String 类型可以转换为 Doris STRUCT 类型：

```sql
mysql> SELECT CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>);
+------------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>) |
+------------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                   |
+------------------------------------------------------------------------------+


mysql> SELECT CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>);
+----------------------------------------------------------------------------+
| CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>) |
+----------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                 |
+----------------------------------------------------------------------------+
```

结构中的字段根据指定的类型单独转换：

```sql
mysql> SELECT CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>);
+--------------------------------------------------------------------------------------------------------------------------+
| CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>) |
+--------------------------------------------------------------------------------------------------------------------------+
| {"key1":[123.45, 678.9], "key2":[12312313]}                                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
```

JSON 和结构定义之间的字段计数和名称必须匹配：

```sql
-- 在非严格模式下，字段不匹配返回 NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
+-------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>) |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

-- 在严格模式下，字段不匹配导致错误
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
ERROR 1105 (HY000): jsonb_value field size 2 is not equal to struct size 1
```

### JSON Null 处理

JSON null 与 SQL NULL 不同：

- 当 JSON 字段包含 null 值时，转换为任何 Doris 类型都会产生 SQL NULL：

```sql
mysql> SELECT CAST(CAST('null' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('null' AS JSON) AS INT) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

## 类型转换总结表

| JSON 类型 | 可转换为 |
|-----------|---------------|
| Bool | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| Null | (始终转换为 SQL NULL) |
| Number | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| String | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING, ARRAY, STRUCT |
| Array | STRING, ARRAY |
| Object | STRING, STRUCT |

### keywords
JSON, JSONB, CAST, 类型转换，to_json
