---
{
    "title": "ARRAY_LAST",
    "language": "zh-CN",
    "description": "查找数组中满足 lambda 表达式的最后一个元素。找到最后一个满足条件的元素并返回。"
}
---

## array_last

<version since="2.0.0">

</version>

## 描述

查找数组中满足 lambda 表达式的最后一个元素。找到最后一个满足条件的元素并返回。

## 语法

```sql
array_last(lambda, ARRAY<T> arr1, [ARRAY<T> arr2, ...])
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

返回类型：T

返回值含义：
- 返回数组中最后一个满足 lambda 表达式的元素
- NULL：如果没有找到满足条件的元素，或者输入数组为 NULL

使用说明：
- lambda 表达式中参数个数需与数组参数个数一致
- 如果没有找到满足条件的元素，返回 NULL
- 不支持输入参数为NULL
- 当有多个数组参数时，所有数组的长度必须一致
- lambda 可以用任意标量表达式，不能用聚合函数
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值

**查询示例：**


查找浮点数数组中最后一个大于等于 3 的元素：
```sql
SELECT array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+----------------------------------------------------+
| array_last(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+----------------------------------------------------+
|                                                5.5 |
+----------------------------------------------------+
```

查找字符串数组中最后一个长度大于 2 的元素：
```sql
SELECT array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+---------------------------------------------------------------------+
| array_last(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+---------------------------------------------------------------------+
| eeeee                                                               |
+---------------------------------------------------------------------+
```

空数组返回 NULL：
```sql
SELECT array_last(x -> x > 0, []);
+-------------------------------------+
| array_last(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

输入参数为NULL 会报错：
```
SELECT array_last(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_last(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_last', expression: array_last(NULL), The 1st arg of array_filter must be lambda but is NULL
```

包含 null 的数组，lambda 可判断 null：
```sql
SELECT array_last(x -> x is not null, [null, 1, null, 3, null, 5]);
+-------------------------------------------------------------+
| array_last(x -> x is not null, [null, 1, null, 3, null, 5]) |
+-------------------------------------------------------------+
|                                                           5 |
+-------------------------------------------------------------+
```

多数组查找，查找第一个数组大于第二个数组的最后一个元素：
```sql
SELECT array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+-------------------------------------------------------------------------+
| array_last((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-------------------------------------------------------------------------+
|                                                                    NULL |
+-------------------------------------------------------------------------+
```

嵌套数组查找，查找每个子数组长度大于 2 的最后一个元素：
```sql
SELECT array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+--------------------------------------------------------------+
| array_last(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+--------------------------------------------------------------+
| [7, 8, 9, 10]                                                |
+--------------------------------------------------------------+
```

参数数量错误会报错：
```sql
SELECT array_last();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_last' which has 0 arity. Candidate functions are: [array_last(Expression, Expression...)]
```

lambda 表达式中参数个数和数组参数个数不一致报错：
```
SELECT array_last(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

传入非数组类型时会报错：
```sql
SELECT array_last(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_last(Expression, VARCHAR(12))
```

### Keywords

ARRAY, LAST, ARRAY_LAST
