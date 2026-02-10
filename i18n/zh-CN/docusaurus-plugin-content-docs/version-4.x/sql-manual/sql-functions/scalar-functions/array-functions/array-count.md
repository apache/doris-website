---
{
    "title": "ARRAY_COUNT",
    "language": "zh-CN",
    "description": "对数组中的元素应用 lambda 表达式，统计返回值不为 0 的元素个数。"
}
---

## array_count

<version since="2.0.0">

</version>

## 描述

对数组中的元素应用 lambda 表达式，统计返回值不为 0 的元素个数。

## 语法

```sql
array_count(lambda, array1, ...)
```

### 参数

- `lambda`：lambda 表达式，用于对数组元素进行判断和计算
- `array1, ...`：一个或多个 ARRAY<T> 类型参数

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂数据类型：ARRAY、MAP、STRUCT


### 返回值

返回类型：BIGINT

返回值含义：
- 返回 lambda 表达式结果是 True 的元素个数
- 0：如果没有元素满足条件，或输入数组为 NULL

使用说明：
- lambda 表达式中参数个数需与数组参数个数一致
- 所有输入数组的长度必须一致
- 支持对多数组、复杂类型数组进行统计
- 空数组返回 0，NULL 数组返回 0
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值


### 示例

```sql
CREATE TABLE array_count_test (
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

INSERT INTO array_count_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['a', null, 'ccc', null, 'eeeee']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**查询示例：**

统计 int_array 中大于 2 的元素个数：
```sql
SELECT array_count(x -> x > 2, int_array) FROM array_count_test WHERE id = 1;
+-------------------------------------+
| array_count(x -> x > 2, int_array)  |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```

统计 double_array 中大于等于 3 的元素个数：
```sql
SELECT array_count(x -> x >= 3, double_array) FROM array_count_test WHERE id = 1;
+------------------------------------------+
| array_count(x -> x >= 3, double_array)   |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

统计 string_array 中长度大于 2 的元素个数：
```sql
SELECT array_count(x -> length(x) > 2, string_array) FROM array_count_test WHERE id = 1;
+--------------------------------------------------+
| array_count(x -> length(x) > 2, string_array)    |
+--------------------------------------------------+
|                                              3   |
+--------------------------------------------------+
```

对于空数组进行计算：
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 3;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

对 NULL 数组进行计算：当输入数组为 NULL 时返回 0，不会抛出错误。
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 4;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

统计包含 null 的数组，lambda 表达式可判断 null：
```sql
SELECT array_count(x -> x is null, [null, 1, null, 2, null]);
+-------------------------------------------------------+
| array_count(x -> x is null, [null, 1, null, 2, null]) |
+-------------------------------------------------------+
|                                                     3 |
+-------------------------------------------------------+
```

多数组统计，统计 int_array > double_array 的元素个数：
```sql
SELECT array_count((x, y) -> x > y, int_array, double_array) FROM array_count_test WHERE id = 1;
+-------------------------------------------------------+
| array_count((x, y) -> x > y, int_array, double_array) |
+-------------------------------------------------------+
|                                                     0 |
+-------------------------------------------------------+
```

复杂类型示例：

嵌套数组统计，统计每个子数组长度大于 2 的个数：
```sql
SELECT array_count(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
+------------------------------------------------------------------+
| array_count(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+------------------------------------------------------------------+
|                                                                2 |
+------------------------------------------------------------------+
```

map 类型统计，统计 key 为 'a' 的 value 大于 10 的个数：
```sql
SELECT array_count(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+--------------------------------------------------------------+
| array_count(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+--------------------------------------------------------------+
|                                                            2 |
+--------------------------------------------------------------+
```

struct 类型统计，统计 age 大于 18 的个数：
```sql
SELECT array_count(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_count(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                                                     2 |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

参数数量错误会报错。
```sql
SELECT array_count(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

数组长度不一致会报错。
```sql
SELECT array_count((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

传入非数组类型时会报错。
```sql
SELECT array_count(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

**嵌套高阶函数示例：**
**正确示例：在 lambda 中调用返回标量的高阶函数**

嵌套数组中使用高阶函数，统计每个子数组中大于5的元素个数：
这里可以嵌套使用，因为内层的 array_count 返回标量值（INT64），外层的 array_count 可以处理。
- array_count(y -> y > 5, [1,2,3]) = 0 → 0 (false)
- array_count(y -> y > 5, [4,5,6]) = 1 → 1 (true)  
- array_count(y -> y > 5, [7,8,9]) = 3 → 3 (true)
- 外层 array_count 统计结果为 2（有两个子数组包含大于5的元素）
```sql
SELECT array_count(x -> array_count(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]);
+------------------------------------------------------------------+
| array_count(x -> array_count(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------+
|                                                                2 |
+------------------------------------------------------------------+
```

**错误示例：lambda 返回数组类型**

lambda 表达式返回数组类型时会报错,  array_count 期望 lambda 返回一个可以转换为布尔值的标量,当 lambda 返回数组时，array_count 无法处理这种类型
- 对于 x = [1,2,3]：array_exists(y -> y > 5, [1,2,3]) 返回 [false, false, false]
- 对于 x = [4,5,6]：array_exists(y -> y > 5, [4,5,6]) 返回 [false, false, true]
```sql
SELECT array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_count(ARRAY<ARRAY<BOOLEAN>>)
```



### keywords

ARRAY, COUNT, ARRAY_COUNT 