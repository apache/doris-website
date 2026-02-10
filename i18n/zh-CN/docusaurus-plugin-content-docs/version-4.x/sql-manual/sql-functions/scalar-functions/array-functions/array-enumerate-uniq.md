---
{
    "title": "ARRAY_ENUMERATE_UNIQ",
    "language": "zh-CN",
    "description": "返回数组中每个元素在数组中的唯一出现次数编号。函数会为数组中的每个元素生成一个编号，表示该元素在数组中第几次出现。"
}
---

## array_enumerate_uniq

<version since="2.0.0">

</version>

## 描述

返回数组中每个元素在数组中的唯一出现次数编号。函数会为数组中的每个元素生成一个编号，表示该元素在数组中第几次出现。

## 语法

```sql
array_enumerate_uniq(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### 参数

- `arr1, arr2, ...`：ARRAY<T> 类型，要生成唯一编号的数组。支持一个或多个数组参数。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：ARRAY<BIGINT>

返回值含义：
- 返回一个与输入数组等长的新数组，每个位置的值为对应元素在数组中的唯一出现次数编号
- NULL：如果输入数组为 NULL

使用说明：
- 函数会为数组中的每个元素生成唯一编号，从1开始递增
- 对于重复出现的元素，每次出现都会获得递增的编号
- 当有多个数组参数时，所有数组的长度必须一致，不一致会报错，多个数组的对应位置进行组合生成元素对，从而生成编号
- 空数组返回空数组，NULL 数组返回 NULL
- 对数组元素中的 null 值：null 元素也会生成对应的编号

**查询示例：**

为数组生成唯一编号，对于重复出现的元素，每次出现都会获得递增的编号：
```sql
SELECT array_enumerate_uniq([1, 2, 1, 3, 2, 1]);
+------------------------------------------+
| array_enumerate_uniq([1, 2, 1, 3, 2, 1]) |
+------------------------------------------+
| [1, 1, 2, 1, 2, 3]                       |
+------------------------------------------+
```

空数组返回空数组：
```sql
SELECT array_enumerate_uniq([]);
+----------------------+
| array_enumerate_uniq([]) |
+----------------------+
| []                   |
+----------------------+
```

NULL 数组返回 NULL
SELECT array_enumerate_uniq(NULL), array_enumerate_uniq(NULL, NULL);
+----------------------------+----------------------------------+
| array_enumerate_uniq(NULL) | array_enumerate_uniq(NULL, NULL) |
+----------------------------+----------------------------------+
| NULL                       | NULL                             |
+----------------------------+----------------------------------+

包含 null 的数组，null 元素也会生成编号：
```sql
SELECT array_enumerate_uniq([1, null, 1, null, 1]);
+--------------------------------------------+
| array_enumerate_uniq([1, null, 1, null, 1]) |
+--------------------------------------------+
| [1, 1, 2, 2, 3]                            |
+--------------------------------------------+
```

多数组参数示例，基于多个数组的组合生成编号：
```sql
SELECT array_enumerate_uniq([1, 2, 1], [10, 20, 10]);
+----------------------------------------------+
| array_enumerate_uniq([1, 2, 1], [10, 20, 10]) |
+----------------------------------------------+
| [1, 1, 2]                                    |
+----------------------------------------------+
```

数组长度不一致会报错：
```sql
SELECT array_enumerate_uniq([1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lengths of all arrays of function array_enumerate_uniq must be equal.
```

IP 类型支持的例子
```
SELECT array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+

mysql> SELECT array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错：
```
SELECT array_enumerate_uniq([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<ARRAY<TINYINT>>, expression is array_enumerate_uniq([[1, 2], [3, 4], [5, 6]])
```

map 类型不支持，报错：
```
SELECT array_enumerate_uniq([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_enumerate_uniq([map('k', 1), map('k', 2), map('k', 3)])
```

参数数量错误会报错：
```sql
SELECT array_enumerate_uniq();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate_uniq' which has 0 arity. Candidate functions are: [array_enumerate_uniq(Expression, Expression...)]
```

传入非数组类型时会报错：
```sql
SELECT array_enumerate_uniq('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate_uniq(VARCHAR(12))
```

### Keywords

ARRAY, ENUMERATE, UNIQ, ARRAY_ENUMERATE_UNIQ 