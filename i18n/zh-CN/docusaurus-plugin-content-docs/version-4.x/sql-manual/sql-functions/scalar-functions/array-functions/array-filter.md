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

**Setup** — 建立 fixture 表并写入 4 行覆盖正常值、边界值、空数组和 NULL 的样本数据。后面所有 example 都引用这张表。

```sql {setup}
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

**Example 1** —— 对 DOUBLE 数组列应用 lambda：保留 `>= 3` 的元素。

```sql {example="1"}
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="1"}
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

**Example 2** —— 对 STRING 数组列应用 lambda：保留 `length > 2` 的元素。

```sql {example="2"}
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
```

```result {example="2"}
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

**Example 3** —— 布尔掩码形式：保留掩码为 `true` 对应位置的元素。

```sql {example="3"}
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
```

```result {example="3"}
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

**Example 4** —— 布尔掩码形式（数组字面量）。

```sql {example="4"}
SELECT array_filter([1,2,3], [true, false, true]);
```

```result {example="4"}
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

**Example 5** —— 布尔数组比原数组长：多余的掩码位被忽略。

```sql {example="5"}
SELECT array_filter([1,2,3], [true, false, true, false]);
```

```result {example="5"}
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

**Example 6** —— 布尔数组比原数组短：只处理掩码覆盖的位置。

```sql {example="6"}
SELECT array_filter([1,2,3], [true, false]);
```

```result {example="6"}
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

**Example 7** —— 空数组返回空数组（`id = 3`）。

```sql {example="7"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
```

```result {example="7"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

**Example 8** —— NULL 数组返回 NULL（`id = 4`）。

```sql {example="8"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
```

```result {example="8"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

**Example 9** —— 数组里含 NULL 元素：可在 lambda 中用 `IS NOT NULL` 过滤掉。

```sql {example="9"}
SELECT array_filter(x -> x is not null, [null, 1, null, 2, null]);
```

```result {example="9"}
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

**Example 10** —— 多参 lambda 在两个数组列上一起处理。

```sql {example="10"}
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="10"}
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

**Example 11** —— 嵌套数组字面量上过滤：保留 `size > 2` 的子数组。

```sql {example="11"}
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
```

```result {example="11"}
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

**Example 12** —— 对 MAP 数组过滤：保留 `x['a'] > 10` 的元素。

```sql {example="12"}
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
```

```result {example="12"}
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

**Example 13** —— 对 STRUCT 数组按字段值过滤。

```sql {example="13"}
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
```

```result {example="13"}
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**Example 14** —— lambda 参数个数必须和传入的数组数量一致。

```sql {example="14"}
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
```

```error {example="14"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

**Example 15** —— 多数组形式要求所有数组长度一致。

```sql {example="15"}
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
```

```error {example="15"}
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

**Example 16** —— 第一个参数必须是数组类型。

```sql {example="16"}
SELECT array_filter(x -> x > 0, 'not_an_array');
```

```error {example="16"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

**Example 17** —— 高阶函数嵌套：内层 `array_count` 返回标量，外层 `array_filter` 的 lambda 可以使用。

```sql {example="17"}
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
```

```result {example="17"}
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**Example 18** —— 反例：外层 `array_filter` 的 lambda 不能返回数组类型（这里 `array_exists` 返回 ARRAY<BOOLEAN> 而非标量）。

```sql {example="18"}
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
```

```error {example="18"}
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### keywords

ARRAY, FILTER, ARRAY_FILTER 