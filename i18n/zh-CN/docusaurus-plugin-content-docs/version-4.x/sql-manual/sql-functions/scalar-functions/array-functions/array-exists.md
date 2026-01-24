---
{
    "title": "ARRAY_EXISTS",
    "language": "zh-CN",
    "description": "对数组中的元素应用 lambda 表达式，返回一个布尔数组，表示每个元素是否满足条件。函数会为数组中的每个元素应用 lambda 表达式，返回对应的布尔值。"
}
---

## array_exists

<version since="2.0.0">

</version>

## 描述

对数组中的元素应用 lambda 表达式，返回一个布尔数组，表示每个元素是否满足条件。函数会为数组中的每个元素应用 lambda 表达式，返回对应的布尔值。

## 语法

```sql
array_exists(lambda, array1, ...)
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

返回类型：ARRAY<BOOLEAN>

返回值含义：
- 返回一个与输入数组等长的布尔数组，每个位置的值为对应元素应用 lambda 表达式的结果
- NULL：参数只输入数组为 NULL且无lambda 表达式

使用说明：
- lambda 表达式中参数个数需与数组参数个数一致
- 所有输入数组的长度必须一致
- 支持对多数组、复杂类型数组进行判断
- 空数组返回空数组，当参数只输入数组为 NULL且无lambda 表达式，返回 NULL， 有lamda 表达式的情况数组为NULL 会报错
- lambda 可以用任意标量表达式，不能用聚合函数
- lambda 表达式可以调用其他高阶函数，但需要返回类型兼容
- 对数组元素中的 null 值：null 元素会传递给 lambda 表达式处理，lambda 可以判断 null 值

**查询示例：**

检查浮点数数组中每个元素是否大于等于 3：
```sql
SELECT array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------+
| array_exists(x -> x >= 3, [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

检查字符串数组中每个元素的长度是否大于 2：
```sql
SELECT array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']);
+--------------------------------------------------+
| array_exists(x -> length(x) > 2, ['a', 'bb', 'ccc', 'dddd', 'eeeee']) |
+--------------------------------------------------+
| [0, 0, 1, 1, 1]                                 |
+--------------------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_exists(x -> x > 0, []);
+-------------------------------------+
| array_exists(x -> x > 0, [])       |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

NULL 数组和lambda 表达式组合，参数中有lambda 表达式结合NULL 会报错，无lambda 表达式则返回 NULL：
```
 SELECT array_exists(NULL);
+--------------------+
| array_exists(NULL) |
+--------------------+
| NULL               |
+--------------------+

SELECT array_exists(x -> x > 2, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is NULL
```

包含 null 的数组，lambda 可判断 null：
任何与 null 进行的比较操作（例如 >、<、=、>=、<=）都会返回 null（除了特殊的 IS NULL或 IS NOT NULL），因为无法确定一个未知值（NULL）是否大于 2，这个行为和 MYSQL, POSTGRESSQL 等保持一致。
```sql
SELECT array_exists(x -> x is not null, [1, null, 3, null, 5]);
+------------------------------------------+
| array_exists(x -> x is not null, [1, null, 3, null, 5]) |
+------------------------------------------+
| [1, 0, 1, 0, 1]                          |
+------------------------------------------+

SELECT array_exists(x -> x > 2, [1, null, 3, null, 5]);
+-------------------------------------------------+
| array_exists(x -> x > 2, [1, null, 3, null, 5]) |
+-------------------------------------------------+
| [0, null, 1, null, 1]                           |
+-------------------------------------------------+
```

多数组判断，检查第一个数组是否大于第二个数组：
```sql
SELECT array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]);
+--------------------------------------------------------+
| array_exists((x, y) -> x > y, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]) |
+--------------------------------------------------------+
| [0, 0, 0, 0, 0]                                       |
+--------------------------------------------------------+
```

复杂类型示例：

嵌套数组判断，检查每个子数组长度是否大于 2：
```sql
SELECT array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]);
+----------------------------------------------------------------+
| array_exists(x -> size(x) > 2, [[1,2],[3,4,5],[6],[7,8,9,10]]) |
+----------------------------------------------------------------+
| [0, 1, 0, 1]                                                   |
+----------------------------------------------------------------+
```

map 类型判断，检查 key 为 'a' 的 value 是否大于 10：
```sql
SELECT array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
+---------------------------------------------------------------+
| array_exists(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [0, 1, 1]                                                     |
+---------------------------------------------------------------+
```

lambda 表达式中参数个数和数组参数个数不一致报错：
```sql
SELECT array_exists(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

数组长度不一致会报错：
```sql
SELECT array_exists((x, y) -> x > y, [1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

传入非数组类型时会报错：
```sql
SELECT array_exists(x -> x > 0, 'not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

### Keywords

ARRAY, EXISTS, ARRAY_EXISTS 