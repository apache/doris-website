---
{
    "title": "ARRAY_INTERSECT",
    "language": "zh-CN",
    "description": "返回多个数组的交集，即所有数组中共同存在的元素。函数会找出所有输入数组中共同存在的元素，去重后组成新数组。"
}
---

## array_intersect

<version since="2.0.0">

</version>

### 描述

返回多个数组的交集，即所有数组中共同存在的元素。函数会找出所有输入数组中共同存在的元素，去重后组成新数组。

### 语法

```sql
array_intersect(ARRAY<T> arr1, ARRAY<T> arr2, [ARRAY<T> arr3, ...])
```

### 参数

- `arr1, arr2, arr3, ...`：ARRAY<T> 类型，要计算交集的数组。支持两个或更多数组参数。

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：ARRAY<T>

返回值含义：
- 返回一个新数组，包含所有输入数组中共同存在的唯一元素
- 空数组，输入的所有参数数组没有共同存在的元素

使用说明：
- 函数会找出所有输入数组中共同存在的元素, 结果数组中的元素会被去重
- 空数组和任何非NULL数组结果都是空数组，如果没有元素重叠，该函数将返回一个空数组。
- 函数不支持数组为 NULL
- 对数组元素中的 null 值：null 元素会被视为普通元素参与运算，null 与 null 被认为是相同的

**查询示例：**

两个数组的交集：
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]);
+------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]) |
+------------------------------------------------+
| [4, 2]                                         |
+------------------------------------------------+
```

多个数组的交集：
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]);
+----------------------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]) |
+----------------------------------------------------------------+
| [2, 4]                                                         |
+----------------------------------------------------------------+
```

字符串数组的交集：
```sql
SELECT array_intersect(['a', 'b', 'c'], ['b', 'c', 'd']);
+--------------------------------------------+
| array_intersect(['a','b','c'], ['b','c','d']) |
+--------------------------------------------+
| ["b", "c"]                                 |
+--------------------------------------------+
```

包含 null 的数组， null 被视为可以比较相等性的值。
```sql
SELECT array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]);
+---------------------------------------------------------+
| array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]) |
+---------------------------------------------------------+
| [null, 2, 3]                                            |
+---------------------------------------------------------+
```

字符串数组和整数数组的交集：
字符串'2' 可以被转换成整数2, 'b' 转换失败变成 null 
```
SELECT array_intersect([1, 2, null, 3], ['2', 'b']);
+----------------------------------------------+
| array_intersect([1, 2, null, 3], ['2', 'b']) |
+----------------------------------------------+
| [null, 2]                                    |
+----------------------------------------------+
```

空数组与任意数组：
```sql
SELECT array_intersect([], [1, 2, 3]);
+-----------------------------+
| array_intersect([], [1,2,3]) |
+-----------------------------+
| []                          |
+-----------------------------+
```

输入数组是NULL 会报错：
```
SELECT array_intersect(NULL, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

复杂类型不支持会报错：
嵌套数组类型不支持，报错：
```
SELECT array_intersect([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<ARRAY<TINYINT>>, expression is array_intersect([[1, 2], [3, 4], [5, 6]])
```

map 类型不支持，报错：
```
SELECT array_intersect([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_intersect([map('k', 1), map('k', 2), map('k', 3)])
```

参数数量错误会报错：
```sql
SELECT array_intersect([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_intersect' which has 1 arity. Candidate functions are: [array_intersect(Expression, Expression, ...)]
```

传入非数组类型会报错：
```sql
SELECT array_intersect('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_intersect(VARCHAR(12), ARRAY<INT>)
```

### Keywords

ARRAY, INTERSECT, ARRAY_INTERSECT 