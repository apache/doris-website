---
{
    "title": "ARRAY_FIRST",
    "language": "zh-CN",
    "description": "返回数组中第一个满足 lambda 表达式条件的元素。函数会对数组中的元素应用 lambda 表达式，找到第一个满足条件的元素并返回。"
}
---

## array_first

<version since="2.0.0">

</version>

### 描述

返回数组中第一个满足 lambda 表达式条件的元素。函数会对数组中的元素应用 lambda 表达式，找到第一个满足条件的元素并返回。

### 语法

```sql
array_first(lambda, array1, ...)
```

### 参数

- `lambda`：lambda 表达式，用于对数组元素进行判断，返回 true/false 或可以转换为布尔值的表达式
- `array1, ...`：一个或多个 ARRAY<T> 类型参数

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6
- 复杂数据类型：ARRAY、MAP、STRUCT

### 返回值

返回类型：T

返回值含义：
- 返回数组中第一个满足 lambda 表达式条件的元素
- NULL：或数组为空或没有元素满足条件

使用说明：
- lambda 表达式中参数个数需与数组参数个数一致
- 所有输入数组的长度必须一致
- 支持对多数组、复杂类型数组进行查找
- 空数组返回 NULL
- 不支持输入参数为NULL
- lambda 可以用任意标量表达式，不能用聚合函数
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值

**查询示例：**

查找浮点数数组中第一个大于等于 3 的元素：
```sql
SELECT array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+-----------------------------------------------------+
| array_first(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+-----------------------------------------------------+
|                                                 3.3 |
+-----------------------------------------------------+
```

查找字符串数组中第一个长度大于 2 的元素：
```sql
SELECT array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+----------------------------------------------------------------------+
| array_first(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+----------------------------------------------------------------------+
| ccc                                                                  |
+----------------------------------------------------------------------+
```

空数组返回 NULL：
```sql
SELECT array_first(x -> x > 0, []);
+-------------------------------------+
| array_first(x -> x > 0, [])        |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

输入参数为NULL 会报错：
```
SELECT array_first(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL

SELECT array_first(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_first', expression: array_first(NULL), The 1st arg of array_filter must be lambda but is NULL
```

包含 null 的数组，lambda 可判断 null：
```sql
SELECT array_first(x -> x is not null, [null, 1, null, 3, null, 5]);
+--------------------------------------------------------------+
| array_first(x -> x is not null, [null, 1, null, 3, null, 5]) |
+--------------------------------------------------------------+
|                                                            1 |
+--------------------------------------------------------------+
```

多数组查找，查找第一个数组大于第二个数组的第一个元素：
```sql
SELECT array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------------------------+
| array_first((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

复杂类型示例：

嵌套数组查找，查找第一个长度大于 2 的子数组：
```sql
SELECT array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+---------------------------------------------------------------+
| array_first(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+---------------------------------------------------------------+
| [3, 4, 5]                                                     |
+---------------------------------------------------------------+
```

map 类型查找，查找第一个 key 为 'a' 的 value 大于 10 的元素：
```sql
SELECT array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_first(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| {"a":15}                                                      |
+---------------------------------------------------------------+
```

参数数量错误会报错：
```sql
SELECT array_first(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

lambda 表达式中参数个数和数组参数个数不一致报错：
```sql
SELECT array_first((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

传入非数组类型时会报错：
```sql
SELECT array_first(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### Keywords

ARRAY, FIRST, ARRAY_FIRST 