---
{
    "title": "ARRAY_JOIN",
    "language": "zh-CN",
    "description": "将数组中的元素连接成一个字符串。函数会将数组中的所有元素转换为字符串，然后用指定的分隔符连接它们。"
}
---

## array_join

<version since="2.0.0">

</version>

## 描述

将数组中的元素连接成一个字符串。函数会将数组中的所有元素转换为字符串，然后用指定的分隔符连接它们。

## 语法

```sql
array_join(ARRAY<T> arr, STRING separator [, STRING null_replacement])
```

### 参数

- `arr`：ARRAY<T> 类型，要连接的数组
- `separator`：STRING 类型，必需参数，用于分隔数组元素的分隔符
- `null_replacement`：STRING 类型，可选参数，用于替换数组中 null 值的字符串。如果不提供此参数，null 值会被跳过

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型: ARRAY、MAP、STRUCT

### 返回值

返回类型：STRING

返回值含义：
- 返回一个字符串，包含数组中所有元素，用分隔符连接
- NULL：如果输入数组为 NULL

使用说明：
- 函数会将数组中的每个元素转换为字符串，元素之间用指定的分隔符连接
- 对数组元素中的 null 值：
  - 如果提供了 `null_replacement` 参数，null 元素会被替换为该字符串
  - 如果没有提供 `null_replacement` 参数，null 元素会被跳过
- 空数组返回空字符串

**查询示例：**

使用分隔符连接数组：
```sql
SELECT array_join([1, 2, 3, 4, 5], ',');
+--------------------------------------+
| array_join([1, 2, 3, 4, 5], ',')    |
+--------------------------------------+
| 1,2,3,4,5                           |
+--------------------------------------+
```

使用空格分隔符连接字符串数组：
```sql
SELECT array_join(['hello', 'world', 'doris'], ' ');
+--------------------------------------------------+
| array_join(['hello', 'world', 'doris'], ' ')    |
+--------------------------------------------------+
| hello world doris                                |
+--------------------------------------------------+
```

连接包含 null 的数组（null 值被跳过）：
```sql
SELECT array_join([1, null, 3, null, 5], '-');
+--------------------------------------------+
| array_join([1, null, 3, null, 5], '-')    |
+--------------------------------------------+
| 1-3-5                                      |
+--------------------------------------------+
```

使用 null_replacement 参数替换 null 值：
```sql
SELECT array_join([1, null, 3, null, 5], '-', 'NULL');
+--------------------------------------------------+
| array_join([1, null, 3, null, 5], '-', 'NULL')  |
+--------------------------------------------------+
| 1-NULL-3-NULL-5                                 |
+--------------------------------------------------+
```

连接浮点数数组：
```sql
SELECT array_join([1.1, 2.2, 3.3], ' | ');
+------------------------------------------+
| array_join([1.1, 2.2, 3.3], ' | ')      |
+------------------------------------------+
| 1.1 | 2.2 | 3.3                         |
+------------------------------------------+
```

连接日期数组：
```sql
SELECT array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ');
+-----------------------------------------------------------------------------------------+
| array_join(CAST(['2023-01-01', '2023-06-15', '2023-12-31'] AS ARRAY<DATETIME>), ' to ') |
+-----------------------------------------------------------------------------------------+
| 2023-01-01 00:00:00 to 2023-06-15 00:00:00 to 2023-12-31 00:00:00                       |
+-----------------------------------------------------------------------------------------+
```

连接 IP 地址数组：
```sql
SELECT array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ');
+----------------------------------------------------------------------------------+
| array_join(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), ' -> ') |
+----------------------------------------------------------------------------------+
| 192.168.1.1 -> 192.168.1.2 -> 192.168.1.3                                       |
+----------------------------------------------------------------------------------+
```
空数组返回空字符串：
```sql
SELECT array_join([], ',');
+----------------------+
| array_join([], ',')  |
+----------------------+
|                      |
+----------------------+
```

NULL 数组返回 NULL：
```sql
SELECT array_join(NULL, ',');
+----------------------+
| array_join(NULL, ',') |
+----------------------+
| NULL                 |
+----------------------+
```

传入复杂类型时会报错：
```sql
SELECT array_join([{'name':'Alice','age':20}, {'name':'Bob','age':30}], '; ');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_join([map('name', 'Alice', 'age','20'), map('name', 'Bob', 'age','30')], '; ') does not support type: MAP<TEXT,TEXT>
```

参数数量错误会报错：
```sql
SELECT array_join([1,2,3], ',', 'extra', 'too_many');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_join' which has 4 arity. Candidate functions are: [array_join(Expression, Expression, Expression), array_join(Expression, Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_join('not_an_array', ',');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_join(VARCHAR(12), VARCHAR(1))
```

### Keywords

ARRAY, JOIN, ARRAY_JOIN
