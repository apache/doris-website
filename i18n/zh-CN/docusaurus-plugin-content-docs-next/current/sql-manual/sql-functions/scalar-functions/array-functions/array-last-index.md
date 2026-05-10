---
{
    "title": "ARRAY_LAST_INDEX",
    "language": "zh-CN",
    "description": "查找数组中满足 lambda 表达式的最后一个元素的位置索引（从1开始）。找到最后一个满足条件的元素并返回其位置索引。"
}
---

## array_last_index

<version since="2.0.0">

</version>

## 描述

查找数组中满足 lambda 表达式的最后一个元素的位置索引（从1开始）。找到最后一个满足条件的元素并返回其位置索引。

## 语法

```sql
array_last_index(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 参数

- `lambda`：lambda 表达式，用于定义查找条件
- `arr1, arr2, ...`：ARRAY<T> 类型，要查找的数组。支持一个或多个数组参数。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：BIGINT

返回值含义：
- 返回数组中最后一个满足 lambda 表达式的元素的位置索引，返回值从 1 开始，而不是从 0 开始。如果找到满足条件的元素与数组中的第一个元素匹配，则此函数返回 1，而不是 0
- 0：如果输入数组为 NULL且无lambda 表达式，或数组为空，或没有元素满足条件

使用说明：
- lambda 表达式中参数个数需与数组参数个数一致
- 空数组返回 0，输入参数是 NULL 数组且无lambda表达式，返回 0，如果输入参数是 NULL 数组有lambda表达式，会报错
- 当有多个数组参数时，所有数组的长度必须一致
- lambda 可以用任意标量表达式，不能用聚合函数
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值

**查询示例：**

查找浮点数数组中最后一个大于等于 3 的元素的位置索引：
```sql
SELECT array_last_index(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------------+
| array_last_index(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------------+
|                                                        5 |
+----------------------------------------------------------+
```

查找字符串数组中最后一个长度大于 2 的元素的位置索引：
```sql
SELECT array_last_index(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------------+
| array_last_index(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------------+
|                                                                         5 |
+---------------------------------------------------------------------------+
```

空数组返回 0：
```sql
SELECT array_last_index(x -> x > 0, []);
+----------------------------------------+
| array_last_index(x -> x > 0, [])     |
+----------------------------------------+
| 0                                      |
+----------------------------------------+
```

NULL 数组和lambda 表达式组合，参数中有lambda 表达式结合NULL 会报错，无lambda 表达式则返回 0：
``` 
SELECT array_last_index(NULL);
+-------------------------+
| array_last_index(NULL) |
+-------------------------+
|                       0 |
+-------------------------+

SELECT array_last_index(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

包含 null 的数组，lambda 可判断 null：
```sql
SELECT array_last_index(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------------+
| array_last_index(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------------+
|                                                                 6 |
+-------------------------------------------------------------------+
```

多数组查找，查找第一个数组大于第二个数组的最后一个元素的位置索引：
```sql
SELECT array_last_index((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------------+
| array_last_index((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------------+
|                                                                             0 |
+-------------------------------------------------------------------------------+
```

嵌套数组查找，查找每个子数组长度大于 2 的最后一个元素的位置索引：
```sql
SELECT array_last_index(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------------------------+
| array_last_index(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------------------------+
|                                                                  4 |
+--------------------------------------------------------------------+
```

map 类型查找，查找最后一个 key 为 'a' 的 value 大于 10 的元素的位置索引：
```
SELECT array_last_index(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+-------------------------------------------------------------------+
| array_last_index(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+-------------------------------------------------------------------+
|                                                                 3 |
+-------------------------------------------------------------------+
```

参数数量错误会报错：
```sql
SELECT array_last_index();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_last_index' which has 0 arity. Candidate functions are: [array_last_index(Expression, Expression...)]
```

lambda 表达式中参数个数和数组参数个数不一致报错：
```
SELECT array_last_index(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

传入非数组类型时会报错：
```sql
SELECT array_last_index(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last_index(Expression, VARCHAR(12))
```

### Keywords

ARRAY, LAST, INDEX, ARRAY_LAST_INDEX
