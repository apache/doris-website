---
{
    "title": "ARRAY_FILTER",
    "language": "zh-CN",
    "description": "根据条件过滤数组元素，返回满足条件的元素组成的新数组。函数支持两种调用方式：使用 lambda 表达式的高阶函数形式，以及直接使用布尔数组的过滤形式。"
}
---

## array_filter

<version since="2.0.0">

</version>

## 描述

根据条件过滤数组元素，返回满足条件的元素组成的新数组。函数支持两种调用方式：使用 lambda 表达式的高阶函数形式，以及直接使用布尔数组的过滤形式。

## 语法

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### 参数

- `lambda`：lambda 表达式，用于对数组元素进行判断，返回 true/false 或可以转换为布尔值的表达式
- `array1, ...`：一个或多个 ARRAY\<T> 类型参数
- `filter_array`：ARRAY\<BOOLEAN> 类型，用于过滤的布尔数组

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
- 返回满足过滤条件的所有元素组成的新数组
- NULL：如果输入数组为 NULL
- 空数组：如果没有元素满足条件

使用说明：
- lambda 形式：lambda 表达式参数个数需与数组参数个数一致
- 布尔数组形式：`array1` 和 `filter_array` 的长度最好完全一致，如果布尔数组更长，多余的布尔值会被忽略；如果布尔数组更短，只处理布尔数组中对应位置的元素
- 支持对多数组、复杂类型数组进行过滤
- 空数组返回空数组，NULL 数组返回 NULL
- lambda 可以用任意标量表达式，不能用聚合函数
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值

### 示例

```sql
CREATE TABLE array_filter_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_filter_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['x', 'yy', 'zzz']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**查询示例：**

使用 lambda 表达式过滤 double_array 中大于等于 3 的元素：
```sql
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

使用 lambda 表达式过滤 string_array 中长度大于 2 的元素：
```sql
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+------------------------------------------+
```

使用布尔数组过滤元素：
```sql
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

布尔数组过滤示例，根据布尔值决定是否保留对应位置的元素：

```sql
SELECT array_filter([1,2,3], [true, false, true]);
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

当布尔数组长度大于原数组时，多余的布尔值会被忽略：
```sql
SELECT array_filter([1,2,3], [true, false, true, false]);
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

当布尔数组长度小于原数组时，只处理布尔数组中对应位置的元素：
```sql
SELECT array_filter([1,2,3], [true, false]);
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL 数组返回 NULL：当输入数组为 NULL 时返回 NULL，不会抛出错误。
```sql
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

包含 null 的数组，lambda 可判断 null：
```sql
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

多数组过滤，过滤 int_array > double_array 的元素：
```sql
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

复杂类型示例：

嵌套数组过滤，过滤每个子数组长度大于 2 的元素：
```sql
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

map 类型过滤，过滤 key 为 'a' 的 value 大于 10 的元素：
```sql
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

struct 类型过滤，过滤 age 大于 18 的元素：
```sql
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

参数数量错误：
```sql
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

数组长度不一致会报错：
```sql
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

传入非数组类型时会报错：
```sql
SELECT array_filter(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```


**嵌套高阶函数示例：**

**正确示例：在 lambda 中调用返回标量的高阶函数**

当前例子可以嵌套使用，因为内层的 array_count 返回标量值（INT64），array_filter 可以处理。
```sql
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**错误示例：lambda 返回数组类型**

当前例子不能嵌套使用，因为内层的 array_exists 返回 ARRAY<BOOLEAN>，而外层的 array_filter 期望 lambda 返回标量值
```sql
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### keywords

ARRAY, FILTER, ARRAY_FILTER 