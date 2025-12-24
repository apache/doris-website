---
{
    "title": "JSON",
    "language": "zh-CN",
    "description": "JSON（JavaScript Object Notation）是一种开放标准的文件格式和数据交换格式，使用可读性强的纯文本来存储和传输数据。根据官方规范 RFC7159，JSON 支持以下基本类型："
}
---

## JSON 介绍

JSON（JavaScript Object Notation）是一种开放标准的文件格式和数据交换格式，使用可读性强的纯文本来存储和传输数据。根据官方规范 [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159)，JSON 支持以下基本类型：
- Bool（布尔值）
- Null（空值）
- Number（数字）
- String（字符串）
- Array（数组）
- Object（对象）

JSON 数据类型，用二进制格式高效存储 [JSON](https://www.rfc-editor.org/rfc/rfc8785) 数据，通过 JSON 函数访问其内部字段。

默认支持 1048576 字节（1 MB），可调大到 2147483643 字节（2 GB），可通过 BE 配置`string_type_length_soft_limit_bytes` 调整。

    与普通 String 类型存储的 JSON 字符串相比，JSON 类型有两点优势
    1. 数据写入时进行 JSON 格式校验
    2. 二进制存储格式更加高效，通过json_extract等函数可以高效访问JSON内部字段，比get_json_xx函数快几倍

    :::caution 注意
    在1.2.x版本中，JSON 类型的名字是 JSONB，为了尽量跟 MySQL 兼容，从 2.0.0 版本开始改名为 JSON，老的表仍然可以使用。
    :::

## JSON 数字精度问题

在使用 JSON 时，需要特别注意数字精度问题：
- 大多数系统中 Number 类型的实现基于 IEEE 754-2008 二进制64位（双精度）浮点数（如 C++ 中的 double 类型）
- 由于 JSON 规范没有强制规定 Number 的底层类型，且不同系统间通过纯文本交换 JSON 数据，可能导致精度损失

对于 JSON 字符串 `{"abc": 18446744073709551616}`：

```sql
-- MySQL 中的转换结果
cast('{"abc": 18446744073709551616}' as json)
-- 结果: {"abc": 1.8446744073709552e19}
```

```javascript
// JavaScript 中的转换结果
console.log(JSON.parse('{"abc": 18446744073709551616}'));
// 结果: {abc: 18446744073709552000}
```

如需在不同系统间保证数字精度不损失，应将大数值存储为字符串格式，如 `{"abc": "18446744073709551616"}`。

## Doris 中的 JSON 类型

Doris 支持符合 JSON 标准规范的数据类型，并采用高效的 JSONB（JSON Binary）格式进行二进制编码存储。

### 支持的类型

Doris JSONB 支持所有 JSON 标准类型。主要区别在于 Doris 对 Number 类型进行了更精细的扩展，以便更精确地映射到 Doris 的内部类型。

| JSON 类型 | 子类型 | 对应的 Doris 类型 |
|----------|-------|-----------------|
| Bool | - | BOOLEAN |
| Null | - | (无直接对应，表示 JSON null 值) |
| Number | Int8 | TINYINT |
| | Int16 | SMALLINT |
| | Int32 | INT |
| | Int64 | BIGINT |
| | Int128 | LARGEINT |
| | Double | DOUBLE |
| | Float | FLOAT |
| | Decimal | DECIMAL |
| String | - | STRING |
| Array | - | ARRAY |
| Object | - | STRUCT |

### 重要说明：
- Null 的含义:
  - JSON 中的 null 是一个有效的值，表示"空值"。这与 SQL 的 NULL（表示"未知"或"缺失"）是不同的概念。
  - CAST('null' AS JSON) 得到一个包含 JSON null 值的 JSONB 列，该列本身在 SQL 层面是非 NULL 的。
  - CAST('null' AS JSON) IS NULL 的结果是 false (0)，因为该列包含一个已知的 JSON null 值，他不是一个SQL的NULL。

## 运算与限制
- 比较与运算：
  - JSONB 列不能直接与其他数据类型（包括其他 JSONB 列）进行比较或进行算术运算。
  - 解决方案： 使用 JSON_EXTRACT 函数提取出 JSONB 中的标量值（如 INT, DOUBLE, STRING, BOOLEAN），然后将其转换为对应的 Doris 原生类型进行比较或运算。
- 排序与分组：
  - JSONB 列不支持 ORDER BY 操作。
- 隐式转换：
  - 仅限输入： 在将数据输入到 JSONB 列时，STRING 类型可以隐式转换为 JSONB（前提是字符串内容是有效的 JSON 文本）。其他 Doris 类型不能隐式转换为 JSONB。

## JSON 的分组支持

从 4.0 版本开始，Doris 支持对 JSON 类型进行 `GROUP BY` 和 `DISTINCT` 操作。以下是一些示例：

### 示例 1：对 JSON 列进行 GROUP BY
```sql
mysql> SELECT * FROM test_jsonb_groupby;
+------+---------------+
| id   | j             |
+------+---------------+
|    1 | {"a":1,"b":2} |
|    2 | {"a":1,"b":3} |
|    3 | {"a":2,"b":2} |
|    4 | {"a":2,"b":2} |
|    5 | {"a":1,"b":2} |
|    6 | {"a":2,"b":2} |
+------+---------------+
6 rows in set (0.07 sec)

mysql> SELECT j, COUNT(*) FROM test_jsonb_groupby GROUP BY j;
+---------------+----------+
| j             | COUNT(*) |
+---------------+----------+
| {"a":1,"b":3} |        1 |
| {"a":2,"b":2} |        3 |
| {"a":1,"b":2} |        2 |
+---------------+----------+
```

### 示例 2：对 JSON 列进行 DISTINCT 查询
```sql
mysql> SELECT DISTINCT j FROM test_jsonb_groupby;
+---------------+
| j             |
+---------------+
| {"a":1,"b":3} |
| {"a":2,"b":2} |
| {"a":1,"b":2} |
+---------------+
```

### 注意事项
1. **二进制比较**：JSON 的比较是基于二进制的。如果两个 JSON 数据在语义上相同，但二进制表示不同，则无法分组到一起。例如：
   ```sql
   mysql> SELECT * FROM test_jsonb;
   +------+------+
   | id   | j    |
   +------+------+
   |    1 | 123  |
   |    2 | 123  |
   +------+------+

   mysql> SELECT j, COUNT(*) FROM test_jsonb GROUP BY j;
   +------+----------+
   | j    | COUNT(*) |
   +------+----------+
   | 123  |        1 |
   | 123  |        1 |
   +------+----------+
   ```

   这是因为第一个 `123` 是 `BIGINT` 类型，第二个 `123` 是 `TINYINT` 类型，二进制表示不同。可以通过以下查询验证其类型：
   ```sql
   mysql> SELECT j, json_type(j, '$') FROM test_jsonb;
   +------+------------------+
   | j    | json_type(j, '$') |
   +------+------------------+
   | 123  | bigint           |
   | 123  | int              |
   +------+------------------+
   ```


   JSON 对象的键顺序不同也会导致无法分组到一起。例如：
   ```sql
   mysql> SELECT * FROM test_jsonb;
   +------+---------------+
   | id   | j             |
   +------+---------------+
   |    2 | {"b":2,"a":1} |
   |    1 | {"a":1,"b":2} |
   +------+---------------+

   mysql> SELECT j, COUNT(*) FROM test_jsonb GROUP BY j;
   +---------------+----------+
   | j             | COUNT(*) |
   +---------------+----------+
   | {"b":2,"a":1} |        1 |
   | {"a":1,"b":2} |        1 |
   +---------------+----------+
   ```

2. **数字类型一致性**：如果希望忽略数字类型的差异，可以使用 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 函数将 JSON 中的数字统一转换为 `DOUBLE` 类型：
   ```sql
   mysql> SELECT NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j), COUNT(*) 
          FROM test_jsonb 
          GROUP BY NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j);
   +-------------------------------------+----------+
   | NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j) | COUNT(*) |
   +-------------------------------------+----------+
   | 123                                 |        2 |
   +-------------------------------------+----------+
   ```
  当通过文本解析方式（如使用 CAST 将字符串转为 JSON）创建 JSON 对象时，Doris 会自动选择合适的数值类型存储，通常情况下不需要担心数值类型不一致的问题。
  所以如果你的Jsonb数据是通过文本解析方式创建的，那么就不会遇到上述的group by问题。

3. **键顺序一致性**：
   可以使用 `SORT_JSON_OBJECT_KEYS` 函数对键进行排序：
   ```sql
   mysql> SELECT SORT_JSON_OBJECT_KEYS(j), COUNT(*) 
          FROM test_jsonb 
          GROUP BY SORT_JSON_OBJECT_KEYS(j);
   +--------------------------+----------+
   | SORT_JSON_OBJECT_KEYS(j) | COUNT(*) |
   +--------------------------+----------+
   | {"a":1,"b":2}            |        2 |
   +--------------------------+----------+
   ```

  当通过文本解析方式（如使用 CAST 将字符串转为 JSON）创建 JSON 对象时，Doris会保留文本中的键顺序。
  所以如果你的Jsonb数据是通过文本解析方式创建的，那么就不会遇到上述的group by问题。

### 建议
如果无法保证 JSON 数据的数字类型一致或键顺序一致，建议在 `GROUP BY` 前先使用 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 和 `SORT_JSON_OBJECT_KEYS` 函数进行预处理，以确保分组操作符合预期。

### 语法

**定义**
```sql
json_column_name JSON
```

**写入**
- INSERT INTO VALUE 格式是引号包围的字符串。例如：
```sql
INSERT INTO table_name(id, json_column_name) VALUES (1, '{"k1": "100"}')
```

- STREAM LOAD 对应列的格式是字符串，不需要额外引号包围。例如：
```
12	{"k1":"v31", "k2": 300}
13	[]
14	[123, 456]
```
- 在 JSON 中出现转移符号 `"\"`，如 `"\n"` 或 `"\t"` 时，在导入时需要通过 replace 函数将 `"\"` 替换为 `"\\"`，例如将 `"\n"` 替换为 `"\\n"`


**查询**
- 直接将整个 JSON 列 SELECT 出来
```sql
SELECT json_column_name FROM table_name;
```

- 从 JSON 中提取需要的字段，或者其他信息，参考 JSON 函数，例如：
```sql
SELECT json_extract(json_column_name, '$.k1') FROM table_name;
```

- JSON 类型可以与整数、字符串、BOOLEAN、ARRAY、MAP 进行类型转换 CAST，例如：
```sql
SELECT CAST('{"k1": "100"}' AS JSON)
SELECT CAST(json_column_name AS String) FROM table_name;
SELECT CAST(json_extract(json_column_name, '$.k1') AS INT) FROM table_name;
```

:::tip

JSON 类型暂时不能用于 ORDER BY，比较大小

:::

## JSONB的输入

将符合 JSON 语法的字符串使用CAST转换为 JSONB。

```sql
-- 简单标量/基本值(数字类型，bool，null，字符串)
mysql> SELECT cast('5' as json);
+-------------------+
| cast('5' as json) |
+-------------------+
| 5                 |
+-------------------+

-- 有零个或者更多元素的数组（元素不需要为同一类型）
mysql> SELECT cast('[1, 2, "foo", null]' as json);
+-------------------------------------+
| cast('[1, 2, "foo", null]' as json) |
+-------------------------------------+
| [1,2,"foo",null]                    |
+-------------------------------------+

-- 包含键值对的对象
-- 注意对象键必须总是带引号的字符串
mysql> SELECT cast('{"bar": "baz", "balance": 7.77, "active": false}' as json);
+------------------------------------------------------------------+
| cast('{"bar": "baz", "balance": 7.77, "active": false}' as json) |
+------------------------------------------------------------------+
| {"bar":"baz","balance":7.77,"active":false}                      |
+------------------------------------------------------------------+

-- 数组和对象可以被任意嵌套
mysql> SELECT cast('{"foo": [true, "bar"], "tags": {"a": 1, "b": null}}' as json);
+---------------------------------------------------------------------+
| cast('{"foo": [true, "bar"], "tags": {"a": 1, "b": null}}' as json) |
+---------------------------------------------------------------------+
| {"foo":[true,"bar"],"tags":{"a":1,"b":null}}                        |
+---------------------------------------------------------------------+
```

Doris的JSONB不保留语义上无关紧要的细节，如空格。

```sql
mysql> -- 输入的文本，和JSON的输出可能并不一样
mysql> SELECT cast('[1,                 2]' as json);
+----------------------------------------+
| cast('[1,                 2]' as json) |
+----------------------------------------+
| [1,2]                                  |
+----------------------------------------+
```

### 关键区别与注意：
- CAST(string AS JSON)：用于解析符合 JSON 语法的字符串。
- CAST(string AS JSON)：对于Number类型，只会解析出Int8,Int16,Int32,Int64,Int128,Double 类型，不会解析出Decimal类型。
- 和其他大部分的JSON实现不同，Doris 的JSONB类型最高支持Int128的精度，对于超出Int128的精度的数字，会有溢出的问题。
- 如果输入的Number字符串为12.34会解析成一个Double，如果没有小数点会解析成一个整数(如果整数的大小超出了Int128的范围，会转换为Double存储，但这有精度损失)

## 使用to_json 将Doris内部的类型转换到JSONB类型

```sql
mysql> SELECT to_json(1) , to_json(3.14) , to_json("12345");
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+

mysql> SELECT to_json(array(array(1,2,3),array(4,5,6)));
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+

mysql> SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+

mysql> SELECT to_json(struct(123,array(4,5,6),"789"));
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+

mysql> SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

to_json 只支持将和JSONB类型有映射的Doris类型转换到JSONB。
例如DECIMAL 可以使用to_json。
但是DATE不可以，需要先将其转换为 STRING 类型，然后再使用 to_json。

## JSONB的输出

Doris 的 JSONB 类型在转换成纯文本与其他系统交互时，会保证生成合法的 JSON 文本：

1. Null 值：
   - 输出为 null（不带引号）
2. 布尔值：
   - true → 输出 true
   - false → 输出 false
3. 数字类型：
   - 所有数值类型直接输出其数值
   - 例如：5 → 输出 5，3.14 → 输出 3.14
4. 字符串：
   - 输出在双引号内："<内容>"
   - 特殊字符进行转义处理：
     - " → \"
     - \ → \\
     - / → \/
     - 退格符 → \b
     - 换页符 → \f
     - 换行符 → \n
     - 回车符 → \r
     - 制表符 → \t
   - 其他控制字符（ASCII < 32）转换为 Unicode 转义序列：\uXXXX
5. 对象（Object）：
   - 格式：{<键值对列表>}
   - 键值对格式："<键>": <值>
   - 多个键值对用逗号分隔
6. 数组（Array）：
   - 格式：[<元素列表>]
   - 多个元素用逗号分隔
7. 嵌套结构处理：
   - 对象和数组支持无限层级嵌套
   - 每个嵌套层级按相同规则递归处理

## 数字精度问题

使用to_json将Doris 内部类型转换为 JSONB 类型时，不会出现精度损失。
使用Doris内部的JSON函数，如果返回值也是 JSONB 类型，不会出现精度损失。
但是如果将Doris的JSONB转换成纯文本再转换成JSONB的话，会出现精度损失问题。

示例：Doris JSON 类型的对象
```
Object{
    "a": (Decimal 18446744073709551616.123)
}
```

转换为纯文本：
```
{"a": 18446744073709551616.123}
```

当纯文本转回 Doris JSON 类型：
```
Object{
    "a": (Double 18446744073709552000)  // 精度丢失
}
```

## 配置和限制
- JSON 默认支持 1,048,576 字节（1 MB）大小
- 可通过 BE 配置 string_type_length_soft_limit_bytes 参数调整大小限制
- 最大可调整至 2,147,483,643 字节（约 2 GB）
- Doris JSON 类型的 Object 中，key 长度不能超过 255 个字节

## 使用示例
    用一个从建表、导数据、查询全周期的例子说明JSON数据类型的功能和用法。

### 创建库表

```
CREATE DATABASE testdb;

USE testdb;

CREATE TABLE test_json (
  id INT,
  j JSON
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES("replication_num" = "1");
```

#### 导入数据

##### stream load 导入 test_json.csv 测试数据

- 测试数据有 2 列，第一列 ID，第二列是 JSON
- 测试数据有 25 行，其中前 18 行的 JSON 是合法的，后 7 行的 JSON 是非法的

```
1	\N
2	null
3	true
4	false
5	100
6	10000
7	1000000000
8	1152921504606846976
9	6.18
10	"abcd"
11	{}
12	{"k1":"v31", "k2": 300}
13	[]
14	[123, 456]
15	["abc", "def"]
16	[null, true, false, 100, 6.18, "abc"]
17	[{"k1":"v41", "k2": 400}, 1, "a", 3.14]
18	{"k1":"v31", "k2": 300, "a1": [{"k1":"v41", "k2": 400}, 1, "a", 3.14]}
19	''
20	'abc'
21	abc
22	100x
23	6.a8
24	{x
25	[123, abc]
```

- 由于有 28% 的非法数据，默认会失败报错 "too many filtered rows"
```
curl --location-trusted -u root: -T test_json.csv http://127.0.0.1:8840/api/testdb/test_json/_stream_load
{
    "TxnId": 12019,
    "Label": "744d9821-9c9f-43dc-bf3b-7ab048f14e32",
    "TwoPhaseCommit": "false",
    "Status": "Fail",
    "Message": "too many filtered rows",
    "NumberTotalRows": 25,
    "NumberLoadedRows": 18,
    "NumberFilteredRows": 7,
    "NumberUnselectedRows": 0,
    "LoadBytes": 380,
    "LoadTimeMs": 48,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 45,
    "CommitAndPublishTimeMs": 0,
    "ErrorURL": "http://172.21.0.5:8840/api/_load_error_log?file=__shard_2/error_log_insert_stmt_95435c4bf5f156df-426735082a9296af_95435c4bf5f156df_426735082a9296af"
}
```

- 设置容错率参数 'max_filter_ratio: 0.3'
```
curl --location-trusted -u root: -H 'max_filter_ratio: 0.3' -T test_json.csv http://127.0.0.1:8840/api/testdb/test_json/_stream_load
{
    "TxnId": 12017,
    "Label": "f37a50c1-43e9-4f4e-a159-a3db6abe2579",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 25,
    "NumberLoadedRows": 18,
    "NumberFilteredRows": 7,
    "NumberUnselectedRows": 0,
    "LoadBytes": 380,
    "LoadTimeMs": 68,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 2,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 45,
    "CommitAndPublishTimeMs": 19,
    "ErrorURL": "http://172.21.0.5:8840/api/_load_error_log?file=__shard_0/error_log_insert_stmt_a1463f98a7b15caf-c79399b920f5bfa3_a1463f98a7b15caf_c79399b920f5bfa3"
}
```

- 查看 stream load 导入的数据，JSON 类型的列 j 会自动转成 JSON String 展示

```
mysql> SELECT * FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+
| id   | j                                                             |
+------+---------------------------------------------------------------+
|    1 |                                                          NULL |
|    2 |                                                          null |
|    3 |                                                          true |
|    4 |                                                         false |
|    5 |                                                           100 |
|    6 |                                                         10000 |
|    7 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |
|    9 |                                                          6.18 |
|   10 |                                                        "abcd" |
|   11 |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |
|   14 |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
+------+---------------------------------------------------------------+
18 rows in set (0.03 sec)

```

##### insert into 插入数据

- insert 1 条数据，总数据从 18 条增加到 19 条
```
mysql> INSERT INTO test_json VALUES(26, '{"k1":"v1", "k2": 200}');
Query OK, 1 row affected (0.09 sec)
{'label':'insert_4ece6769d1b42fd_ac9f25b3b8f3dc02', 'status':'VISIBLE', 'txnId':'12016'}

mysql> SELECT * FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+
| id   | j                                                             |
+------+---------------------------------------------------------------+
|    1 |                                                          NULL |
|    2 |                                                          null |
|    3 |                                                          true |
|    4 |                                                         false |
|    5 |                                                           100 |
|    6 |                                                         10000 |
|    7 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |
|    9 |                                                          6.18 |
|   10 |                                                        "abcd" |
|   11 |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |
|   14 |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 |                                          {"k1":"v1","k2":200} |
+------+---------------------------------------------------------------+
19 rows in set (0.03 sec)

```

#### 查询

##### 用 json_extract 取 json 内的某个字段

1. 获取整个 json，$ 在 json path 中代表 root，即整个 json
```
+------+---------------------------------------------------------------+---------------------------------------------------------------+
| id   | j                                                             | json_extract(`j`, '$')                                       |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
|    1 |                                                          NULL |                                                          NULL |
|    2 |                                                          null |                                                          null |
|    3 |                                                          true |                                                          true |
|    4 |                                                         false |                                                         false |
|    5 |                                                           100 |                                                           100 |
|    6 |                                                         10000 |                                                         10000 |
|    7 |                                                    1000000000 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |                                           1152921504606846976 |
|    9 |                                                          6.18 |                                                          6.18 |
|   10 |                                                        "abcd" |                                                        "abcd" |
|   11 |                                                            {} |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |                                                            [] |
|   14 |                                                     [123,456] |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 |                                          {"k1":"v1","k2":200} |                                          {"k1":"v1","k2":200} |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
19 rows in set (0.03 sec)
```

1. 获取 k1 字段，没有 k1 字段的行返回 NULL
```
mysql> SELECT id, j, json_extract(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------------+
| id   | j                                                             | json_extract(`j`, '$.k1') |
+------+---------------------------------------------------------------+----------------------------+
|    1 |                                                          NULL |                       NULL |
|    2 |                                                          null |                       NULL |
|    3 |                                                          true |                       NULL |
|    4 |                                                         false |                       NULL |
|    5 |                                                           100 |                       NULL |
|    6 |                                                         10000 |                       NULL |
|    7 |                                                    1000000000 |                       NULL |
|    8 |                                           1152921504606846976 |                       NULL |
|    9 |                                                          6.18 |                       NULL |
|   10 |                                                        "abcd" |                       NULL |
|   11 |                                                            {} |                       NULL |
|   12 |                                         {"k1":"v31","k2":300} |                      "v31" |
|   13 |                                                            [] |                       NULL |
|   14 |                                                     [123,456] |                       NULL |
|   15 |                                                 ["abc","def"] |                       NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                       NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                       NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                      "v31" |
|   26 |                                          {"k1":"v1","k2":200} |                       "v1" |
+------+---------------------------------------------------------------+----------------------------+
19 rows in set (0.03 sec)
```

1. 获取顶层数组的第 0 个元素
```
mysql> SELECT id, j, json_extract(j, '$[0]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------------+
| id   | j                                                             | json_extract(`j`, '$[0]') |
+------+---------------------------------------------------------------+----------------------------+
|    1 |                                                          NULL |                       NULL |
|    2 |                                                          null |                       NULL |
|    3 |                                                          true |                       NULL |
|    4 |                                                         false |                       NULL |
|    5 |                                                           100 |                       NULL |
|    6 |                                                         10000 |                       NULL |
|    7 |                                                    1000000000 |                       NULL |
|    8 |                                           1152921504606846976 |                       NULL |
|    9 |                                                          6.18 |                       NULL |
|   10 |                                                        "abcd" |                       NULL |
|   11 |                                                            {} |                       NULL |
|   12 |                                         {"k1":"v31","k2":300} |                       NULL |
|   13 |                                                            [] |                       NULL |
|   14 |                                                     [123,456] |                        123 |
|   15 |                                                 ["abc","def"] |                      "abc" |
|   16 |                              [null,true,false,100,6.18,"abc"] |                       null |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |      {"k1":"v41","k2":400} |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                       NULL |
|   26 |                                          {"k1":"v1","k2":200} |                       NULL |
+------+---------------------------------------------------------------+----------------------------+
19 rows in set (0.03 sec)
```

1. 获取整个 json array
```
mysql> SELECT id, j, json_extract(j, '$.a1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+------------------------------------+
| id   | j                                                             | json_extract(`j`, '$.a1')         |
+------+---------------------------------------------------------------+------------------------------------+
|    1 |                                                          NULL |                               NULL |
|    2 |                                                          null |                               NULL |
|    3 |                                                          true |                               NULL |
|    4 |                                                         false |                               NULL |
|    5 |                                                           100 |                               NULL |
|    6 |                                                         10000 |                               NULL |
|    7 |                                                    1000000000 |                               NULL |
|    8 |                                           1152921504606846976 |                               NULL |
|    9 |                                                          6.18 |                               NULL |
|   10 |                                                        "abcd" |                               NULL |
|   11 |                                                            {} |                               NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               NULL |
|   13 |                                                            [] |                               NULL |
|   14 |                                                     [123,456] |                               NULL |
|   15 |                                                 ["abc","def"] |                               NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                               NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                               NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | [{"k1":"v41","k2":400},1,"a",3.14] |
|   26 |                                          {"k1":"v1","k2":200} |                               NULL |
+------+---------------------------------------------------------------+------------------------------------+
19 rows in set (0.02 sec)
```

1. 获取 json array 中嵌套 object 的字段
```
mysql> SELECT id, j, json_extract(j, '$.a1[0]'), json_extract(j, '$.a1[0].k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
| id   | j                                                             | json_extract(`j`, '$.a1[0]') | json_extract(`j`, '$.a1[0].k1') |
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
|    1 |                                                          NULL |                          NULL |                             NULL |
|    2 |                                                          null |                          NULL |                             NULL |
|    3 |                                                          true |                          NULL |                             NULL |
|    4 |                                                         false |                          NULL |                             NULL |
|    5 |                                                           100 |                          NULL |                             NULL |
|    6 |                                                         10000 |                          NULL |                             NULL |
|    7 |                                                    1000000000 |                          NULL |                             NULL |
|    8 |                                           1152921504606846976 |                          NULL |                             NULL |
|    9 |                                                          6.18 |                          NULL |                             NULL |
|   10 |                                                        "abcd" |                          NULL |                             NULL |
|   11 |                                                            {} |                          NULL |                             NULL |
|   12 |                                         {"k1":"v31","k2":300} |                          NULL |                             NULL |
|   13 |                                                            [] |                          NULL |                             NULL |
|   14 |                                                     [123,456] |                          NULL |                             NULL |
|   15 |                                                 ["abc","def"] |                          NULL |                             NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                          NULL |                             NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                          NULL |                             NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |         {"k1":"v41","k2":400} |                            "v41" |
|   26 |                                          {"k1":"v1","k2":200} |                          NULL |                             NULL |
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
19 rows in set (0.02 sec)

```

1. 获取具体类型的
- json_extract_string 获取 String 类型字段，非 String 类型转成 String
```
mysql> SELECT id, j, json_extract_string(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+---------------------------------------------------------------+
| id   | j                                                             | json_extract_string(`j`, '$')                                |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
|    1 | NULL                                                          | NULL                                                          |
|    2 | null                                                          | null                                                          |
|    3 | true                                                          | true                                                          |
|    4 | false                                                         | false                                                         |
|    5 | 100                                                           | 100                                                           |
|    6 | 10000                                                         | 10000                                                         |
|    7 | 1000000000                                                    | 1000000000                                                    |
|    8 | 1152921504606846976                                           | 1152921504606846976                                           |
|    9 | 6.18                                                          | 6.18                                                          |
|   10 | "abcd"                                                        | abcd                                                          |
|   11 | {}                                                            | {}                                                            |
|   12 | {"k1":"v31","k2":300}                                         | {"k1":"v31","k2":300}                                         |
|   13 | []                                                            | []                                                            |
|   14 | [123,456]                                                     | [123,456]                                                     |
|   15 | ["abc","def"]                                                 | ["abc","def"]                                                 |
|   16 | [null,true,false,100,6.18,"abc"]                              | [null,true,false,100,6.18,"abc"]                              |
|   17 | [{"k1":"v41","k2":400},1,"a",3.14]                            | [{"k1":"v41","k2":400},1,"a",3.14]                            |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 | {"k1":"v1","k2":200}                                          | {"k1":"v1","k2":200}                                          |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_string(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_string(`j`, '$.k1') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL | NULL                              |
|    2 |                                                          null | NULL                              |
|    3 |                                                          true | NULL                              |
|    4 |                                                         false | NULL                              |
|    5 |                                                           100 | NULL                              |
|    6 |                                                         10000 | NULL                              |
|    7 |                                                    1000000000 | NULL                              |
|    8 |                                           1152921504606846976 | NULL                              |
|    9 |                                                          6.18 | NULL                              |
|   10 |                                                        "abcd" | NULL                              |
|   11 |                                                            {} | NULL                              |
|   12 |                                         {"k1":"v31","k2":300} | v31                               |
|   13 |                                                            [] | NULL                              |
|   14 |                                                     [123,456] | NULL                              |
|   15 |                                                 ["abc","def"] | NULL                              |
|   16 |                              [null,true,false,100,6.18,"abc"] | NULL                              |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | NULL                              |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | v31                               |
|   26 |                                          {"k1":"v1","k2":200} | v1                                |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.03 sec)

```

- json_extract_int 获取 int 类型字段，非 int 类型返回 NULL
```
mysql> SELECT id, j, json_extract_int(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------+
| id   | j                                                             | json_extract_int(`j`, '$') |
+------+---------------------------------------------------------------+-----------------------------+
|    1 |                                                          NULL |                        NULL |
|    2 |                                                          null |                        NULL |
|    3 |                                                          true |                        NULL |
|    4 |                                                         false |                        NULL |
|    5 |                                                           100 |                         100 |
|    6 |                                                         10000 |                       10000 |
|    7 |                                                    1000000000 |                  1000000000 |
|    8 |                                           1152921504606846976 |                        NULL |
|    9 |                                                          6.18 |                        NULL |
|   10 |                                                        "abcd" |                        NULL |
|   11 |                                                            {} |                        NULL |
|   12 |                                         {"k1":"v31","k2":300} |                        NULL |
|   13 |                                                            [] |                        NULL |
|   14 |                                                     [123,456] |                        NULL |
|   15 |                                                 ["abc","def"] |                        NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                        NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                        NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                        NULL |
|   26 |                                          {"k1":"v1","k2":200} |                        NULL |
+------+---------------------------------------------------------------+-----------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_int(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_int(`j`, '$.k2') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                           NULL |
|    6 |                                                         10000 |                           NULL |
|    7 |                                                    1000000000 |                           NULL |
|    8 |                                           1152921504606846976 |                           NULL |
|    9 |                                                          6.18 |                           NULL |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                            300 |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                            300 |
|   26 |                                          {"k1":"v1","k2":200} |                            200 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)
```

- json_extract_bigint 获取 bigint 类型字段，非 bigint 类型返回 NULL
```
mysql> SELECT id, j, json_extract_bigint(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_bigint(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                            100 |
|    6 |                                                         10000 |                          10000 |
|    7 |                                                    1000000000 |                     1000000000 |
|    8 |                                           1152921504606846976 |            1152921504606846976 |
|    9 |                                                          6.18 |                           NULL |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                           NULL |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           NULL |
|   26 |                                          {"k1":"v1","k2":200} |                           NULL |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

mysql> SELECT id, j, json_extract_bigint(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_bigint(`j`, '$.k2') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL |                              NULL |
|    2 |                                                          null |                              NULL |
|    3 |                                                          true |                              NULL |
|    4 |                                                         false |                              NULL |
|    5 |                                                           100 |                              NULL |
|    6 |                                                         10000 |                              NULL |
|    7 |                                                    1000000000 |                              NULL |
|    8 |                                           1152921504606846976 |                              NULL |
|    9 |                                                          6.18 |                              NULL |
|   10 |                                                        "abcd" |                              NULL |
|   11 |                                                            {} |                              NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               300 |
|   13 |                                                            [] |                              NULL |
|   14 |                                                     [123,456] |                              NULL |
|   15 |                                                 ["abc","def"] |                              NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                               300 |
|   26 |                                          {"k1":"v1","k2":200} |                               200 |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.02 sec)

```

- json_extract_double 获取 double 类型字段，非 double 类型返回 NULL
```
mysql> SELECT id, j, json_extract_double(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_double(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                            100 |
|    6 |                                                         10000 |                          10000 |
|    7 |                                                    1000000000 |                     1000000000 |
|    8 |                                           1152921504606846976 |          1.152921504606847e+18 |
|    9 |                                                          6.18 |                           6.18 |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                           NULL |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           NULL |
|   26 |                                          {"k1":"v1","k2":200} |                           NULL |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_double(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_double(`j`, '$.k2') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL |                              NULL |
|    2 |                                                          null |                              NULL |
|    3 |                                                          true |                              NULL |
|    4 |                                                         false |                              NULL |
|    5 |                                                           100 |                              NULL |
|    6 |                                                         10000 |                              NULL |
|    7 |                                                    1000000000 |                              NULL |
|    8 |                                           1152921504606846976 |                              NULL |
|    9 |                                                          6.18 |                              NULL |
|   10 |                                                        "abcd" |                              NULL |
|   11 |                                                            {} |                              NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               300 |
|   13 |                                                            [] |                              NULL |
|   14 |                                                     [123,456] |                              NULL |
|   15 |                                                 ["abc","def"] |                              NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                               300 |
|   26 |                                          {"k1":"v1","k2":200} |                               200 |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.03 sec)
```

- json_extract_bool 获取 bool 类型字段，非 bool 类型返回 NULL
```
mysql> SELECT id, j, json_extract_bool(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+------------------------------+
| id   | j                                                             | json_extract_bool(`j`, '$') |
+------+---------------------------------------------------------------+------------------------------+
|    1 |                                                          NULL |                         NULL |
|    2 |                                                          null |                         NULL |
|    3 |                                                          true |                            1 |
|    4 |                                                         false |                            0 |
|    5 |                                                           100 |                         NULL |
|    6 |                                                         10000 |                         NULL |
|    7 |                                                    1000000000 |                         NULL |
|    8 |                                           1152921504606846976 |                         NULL |
|    9 |                                                          6.18 |                         NULL |
|   10 |                                                        "abcd" |                         NULL |
|   11 |                                                            {} |                         NULL |
|   12 |                                         {"k1":"v31","k2":300} |                         NULL |
|   13 |                                                            [] |                         NULL |
|   14 |                                                     [123,456] |                         NULL |
|   15 |                                                 ["abc","def"] |                         NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                         NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                         NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                         NULL |
|   26 |                                          {"k1":"v1","k2":200} |                         NULL |
+------+---------------------------------------------------------------+------------------------------+
19 rows in set (0.01 sec)

mysql> SELECT id, j, json_extract_bool(j, '$[1]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+---------------------------------+
| id   | j                                                             | json_extract_bool(`j`, '$[1]') |
+------+---------------------------------------------------------------+---------------------------------+
|    1 |                                                          NULL |                            NULL |
|    2 |                                                          null |                            NULL |
|    3 |                                                          true |                            NULL |
|    4 |                                                         false |                            NULL |
|    5 |                                                           100 |                            NULL |
|    6 |                                                         10000 |                            NULL |
|    7 |                                                    1000000000 |                            NULL |
|    8 |                                           1152921504606846976 |                            NULL |
|    9 |                                                          6.18 |                            NULL |
|   10 |                                                        "abcd" |                            NULL |
|   11 |                                                            {} |                            NULL |
|   12 |                                         {"k1":"v31","k2":300} |                            NULL |
|   13 |                                                            [] |                            NULL |
|   14 |                                                     [123,456] |                            NULL |
|   15 |                                                 ["abc","def"] |                            NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                               1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                            NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                            NULL |
|   26 |                                          {"k1":"v1","k2":200} |                            NULL |
+------+---------------------------------------------------------------+---------------------------------+
19 rows in set (0.01 sec)
```

- json_extract_isnull 获取 JSON NULL 类型字段，null 返回 1，非 null 返回 0
- 需要注意的是 JSON NULL 和 SQL NULL 不一样，SQL NULL 表示某个字段的值不存在，而 JSON 表示值存在但是是一个特殊值 NULL
```
mysql> SELECT id, j, json_extract_isnull(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_isnull(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              1 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              0 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              0 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              0 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              0 |
|   26 |                                          {"k1":"v1","k2":200} |                              0 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

```

##### 用 json_exists_path 检查 json 内的某个字段是否存在

```
mysql> SELECT id, j, json_exists_path(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------+
| id   | j                                                             | json_exists_path(`j`, '$') |
+------+---------------------------------------------------------------+-----------------------------+
|    1 |                                                          NULL |                        NULL |
|    2 |                                                          null |                           1 |
|    3 |                                                          true |                           1 |
|    4 |                                                         false |                           1 |
|    5 |                                                           100 |                           1 |
|    6 |                                                         10000 |                           1 |
|    7 |                                                    1000000000 |                           1 |
|    8 |                                           1152921504606846976 |                           1 |
|    9 |                                                          6.18 |                           1 |
|   10 |                                                        "abcd" |                           1 |
|   11 |                                                            {} |                           1 |
|   12 |                                         {"k1":"v31","k2":300} |                           1 |
|   13 |                                                            [] |                           1 |
|   14 |                                                     [123,456] |                           1 |
|   15 |                                                 ["abc","def"] |                           1 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           1 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           1 |
|   26 |                                          {"k1":"v1","k2":200} |                           1 |
+------+---------------------------------------------------------------+-----------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_exists_path(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_exists_path(`j`, '$.k1') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              0 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              1 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              0 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              0 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              1 |
|   26 |                                          {"k1":"v1","k2":200} |                              1 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

mysql> SELECT id, j, json_exists_path(j, '$[2]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_exists_path(`j`, '$[2]') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              0 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              0 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              1 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              0 |
|   26 |                                          {"k1":"v1","k2":200} |                              0 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.02 sec)


```

##### 用 json_type 获取 JSON 内的某个字段的类型

- 返回 json path 对应的 JSON 字段类型，如果不存在返回 NULL
```
mysql> SELECT id, j, json_type(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------+
| id   | j                                                             | json_type(`j`, '$') |
+------+---------------------------------------------------------------+----------------------+
|    1 |                                                          NULL | NULL                 |
|    2 |                                                          null | null                 |
|    3 |                                                          true | bool                 |
|    4 |                                                         false | bool                 |
|    5 |                                                           100 | int                  |
|    6 |                                                         10000 | int                  |
|    7 |                                                    1000000000 | int                  |
|    8 |                                           1152921504606846976 | bigint               |
|    9 |                                                          6.18 | double               |
|   10 |                                                        "abcd" | string               |
|   11 |                                                            {} | object               |
|   12 |                                         {"k1":"v31","k2":300} | object               |
|   13 |                                                            [] | array                |
|   14 |                                                     [123,456] | array                |
|   15 |                                                 ["abc","def"] | array                |
|   16 |                              [null,true,false,100,6.18,"abc"] | array                |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | array                |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | object               |
|   26 |                                          {"k1":"v1","k2":200} | object               |
+------+---------------------------------------------------------------+----------------------+
19 rows in set (0.02 sec)

mysql> select id, j, json_type(j, '$.k1') from test_json order by id;
+------+---------------------------------------------------------------+-------------------------+
| id   | j                                                             | json_type(`j`, '$.k1') |
+------+---------------------------------------------------------------+-------------------------+
|    1 |                                                          NULL | NULL                    |
|    2 |                                                          null | NULL                    |
|    3 |                                                          true | NULL                    |
|    4 |                                                         false | NULL                    |
|    5 |                                                           100 | NULL                    |
|    6 |                                                         10000 | NULL                    |
|    7 |                                                    1000000000 | NULL                    |
|    8 |                                           1152921504606846976 | NULL                    |
|    9 |                                                          6.18 | NULL                    |
|   10 |                                                        "abcd" | NULL                    |
|   11 |                                                            {} | NULL                    |
|   12 |                                         {"k1":"v31","k2":300} | string                  |
|   13 |                                                            [] | NULL                    |
|   14 |                                                     [123,456] | NULL                    |
|   15 |                                                 ["abc","def"] | NULL                    |
|   16 |                              [null,true,false,100,6.18,"abc"] | NULL                    |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | NULL                    |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | string                  |
|   26 |                                          {"k1":"v1","k2":200} | string                  |
+------+---------------------------------------------------------------+-------------------------+
19 rows in set (0.03 sec)

```

### FAQ
1. JSON 类型中的 null 和 SQL 中的 NULL(IS NULL) 有区别吗

是的，JSON 中的 null 例如 `{"key1" : null}` 表示`key1`这个 JSON 键存在，并且值为 null (作为一个特殊类型会被编码到 JSON binary 中)，而 SQL 中的 NULL 是指没有这个 JSON 键。例如
``` sql 
mysql> SELECT JSON_EXTRACT_STRING('{"key1" : null}', "$.key1") IS NULL;
+----------------------------------------------------------+
| JSON_EXTRACT_STRING('{"key1" : null}', "$.key1") IS NULL |
+----------------------------------------------------------+
|                                                        0 |
+----------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SELECT JSON_EXTRACT_STRING('{"key1" : null}', "$.key_not_exist") IS NULL;
+-------------------------------------------------------------------+
| JSON_EXTRACT_STRING('{"key1" : null}', "$.key_not_exist") IS NULL |
+-------------------------------------------------------------------+
|                                                                 1 |
+-------------------------------------------------------------------+
1 row in set (0.01 sec)
```

2. `GET_JSON_XXX` 函数和 `JSON_EXTRACT_XXX` 函数的区别，以及怎么选择

`GET_JSON_XXX` 是针对字符串类型设计的函数，是直接在原生字符串上做提取操作，而 `JSON_EXTRACT_XXX` 是针对 JSON 类型实现的函数，针对 JSON 类型有特殊优化。一般建议使用 `JSON_EXTRACT_XXX` 性能会更好。

### keywords
JSON, json_parse, json_parse_error_to_null, json_parse_error_to_value, json_extract, json_extract_isnull, json_extract_bool, json_extract_int, json_extract_bigint, json_extract_double, json_extract_String, json_exists_path, json_type
