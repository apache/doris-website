---
{
    "title": "ARRAY_CONCAT",
    "language": "zh-CN",
    "description": "将输入的所有数组拼接为一个数组。函数接受一个或更多数组作为参数，按照参数顺序将它们连接成一个新的数组。"
}
---

## array_concat

<version since="2.0.0">

</version>

## 描述

将输入的所有数组拼接为一个数组。函数接受一个或更多数组作为参数，按照参数顺序将它们连接成一个新的数组。

## 语法

```sql
array_concat(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 参数

- `arr1, arr2, ...`：ARRAY\<T> 类型，要拼接的数组。支持列名或常量值。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂数据类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：ARRAY\<T>

返回值含义：
- 拼接后的新数组，包含所有输入数组的元素，顺序保持不变
- NULL：如果任何一个输入数组为 NULL

使用说明：
- 空数组会被忽略，不添加任何元素
- 只有一个数组且为空数组时，返回空数组；只有一个参数且为 NULL 时，返回 NULL
- 复杂类型（嵌套数组、MAP、STRUCT）拼接时要求结构完全一致，否则报错
- 对数组元素中的 null 值：null 元素会被正常保留在拼接结果中

### 示例

```sql
CREATE TABLE array_concat_test (
    id INT,
    int_array1 ARRAY<INT>,
    int_array2 ARRAY<INT>,
    string_array1 ARRAY<STRING>,
    string_array2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_concat_test VALUES
(1, [1, 2, 3], [4, 5, 6], ['a', 'b'], ['c', 'd']),
(2, [10, 20], [30, 40], [], ['x', 'y']),
(3, NULL, [100, 200], NULL, ['z']),
(4, [], [], [], []),
(5, [1, null, 3], [null, 5, 6], ['a', null, 'c'], ['d', 'e']);
```

**查询示例：**

多个数组字面量拼接：
```sql
SELECT array_concat([1, 2], [7, 8], [5, 6]);
+--------------------------------------+
| array_concat([1, 2], [7, 8], [5, 6]) |
+--------------------------------------+
| [1, 2, 7, 8, 5, 6]                   |
+--------------------------------------+
```

字符串数组拼接：
```sql
SELECT array_concat(string_array1, string_array2) FROM array_concat_test WHERE id = 1;
+--------------------------------------------+
| array_concat(string_array1, string_array2) |
+--------------------------------------------+
| ["a", "b", "c", "d"]                       |
+--------------------------------------------+
```

空数组拼接：
```sql
SELECT array_concat([], []);
+----------------------+
| array_concat([], []) |
+----------------------+
| []                   |
+----------------------+
```

NULL 数组拼接：
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 3;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```

包含 null 元素的数组拼接：null 元素会被正常保留在拼接结果中。
```sql
SELECT array_concat(int_array1, int_array2) FROM array_concat_test WHERE id = 5;
+--------------------------------------+
| array_concat(int_array1, int_array2) |
+--------------------------------------+
| [1, null, 3, null, 5, 6]             |
+--------------------------------------+
```

类型兼容性示例：int_array1 和 string_array1 拼接，string 元素无法转换为 int，结果为 null。
```sql
SELECT array_concat(int_array1, string_array1) FROM array_concat_test WHERE id = 1;
+-----------------------------------------+
| array_concat(int_array1, string_array1) |
+-----------------------------------------+
| [1, 2, 3, null, null]                   |
+-----------------------------------------+
```

复杂类型示例：

嵌套数组拼接，结构一致时可拼接。
```sql
SELECT array_concat([[1,2],[3,4]], [[5,6],[7,8]]);
+--------------------------------------------+
| array_concat([[1,2],[3,4]], [[5,6],[7,8]]) |
+--------------------------------------------+
| [[1, 2], [3, 4], [5, 6], [7, 8]]           |
+--------------------------------------------+
```

嵌套数组结构不一致时，报错。
```sql
SELECT array_concat([[1,2]], [{'k':1}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<ARRAY<INT>> to target type=ARRAY<DOUBLE>
```

map 类型拼接，结构一致时可拼接。
```sql
SELECT array_concat([{'k':1}], [{'k':2}]);
+------------------------------------+
| array_concat([{'k':1}], [{'k':2}]) |
+------------------------------------+
| [{"k":1}, {"k":2}]                 |
+------------------------------------+
```


struct 类型拼接，结构一致时可拼接。
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30)));
+--------------------------------------------------------------------------------------------------------+
| array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('name','Bob','age',30))) |
+--------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                                                 |
+--------------------------------------------------------------------------------------------------------+
```

struct 结构不一致时，报错。
```sql
SELECT array_concat(array(named_struct('name','Alice','age',20)), array(named_struct('id',1,'score',95.5,'age',10)));
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<STRUCT<name:VARCHAR(5),age:TINYINT>> to target type=ARRAY<DOUBLE>
```

参数数量错误会报错。
```sql
SELECT array_concat();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_concat' which has 0 arity. Candidate functions are: [array_concat(Expression, Expression, ...)]
```

传入非数组类型时会报错。
```sql
SELECT array_concat('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_concat(VARCHAR(12))
```

### 注意事项

   确保所有输入数组的元素类型兼容,特别是嵌套复杂类型的结构最好一致,避免在运行时出现类型转换错误

### keywords

ARRAY, CONCAT, ARRAY_CONCAT 