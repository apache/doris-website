---
{
    "title": "ARRAY_POSITION",
    "language": "zh-CN",
    "description": "查找数组中指定元素第一次出现的位置索引（从1开始）。函数会从左到右遍历数组，找到第一个匹配的元素并返回其位置索引。"
}
---

## array_position

<version since="2.0.0">

</version>

## 描述

查找数组中指定元素第一次出现的位置索引（从1开始）。函数会从左到右遍历数组，找到第一个匹配的元素并返回其位置索引。

## 语法

```sql
array_position(ARRAY<T> arr, T element)
```

### 参数

- `arr`：ARRAY<T> 类型，要查找的数组
- `element`：T 类型，要查找的元素

**T 支持的类型：**
- 数值类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 字符串类型：CHAR、VARCHAR、STRING
- 日期时间类型：DATE、DATETIME、DATEV2、DATETIMEV2
- 布尔类型：BOOLEAN
- IP 类型：IPV4、IPV6

### 返回值

返回类型：BIGINT

返回值含义：
- 返回指定元素在数组中第一次出现的位置索引，返回值从 1 开始，而不是从 0 开始。如果要查找的元素是数组中的第一个元素，则此函数返回 1，而不是 0
- 0：如果没有找到匹配的元素，或者输入数组为 NULL
- NULL: 输入数组为NULL

使用说明：
- 函数会从左到右遍历数组，找到第一个匹配的元素，如果没有找到匹配的元素，返回 0
- 空数组返回 0
- 对数组元素中的 null 值：null 元素可以正常匹配

**查询示例：**

查找字符串在数组中的位置：
```sql
SELECT array_position(['apple', 'banana', 'cherry', 'apple'], 'apple');
+-----------------------------------------------------------------+
| array_position(['apple', 'banana', 'cherry', 'apple'], 'apple') |
+-----------------------------------------------------------------+
|                                                               1 |
+-----------------------------------------------------------------+
```

查找浮点数在数组中的位置：
```sql
SELECT array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3);
+------------------------------------------------+
| array_position([1.1, 2.2, 3.3, 4.4, 5.5], 3.3) |
+------------------------------------------------+
|                                              3 |
+------------------------------------------------+
```

查找不存在的元素：
```sql
SELECT array_position([1, 2, 3, 4, 5], 10);
+-------------------------------------+
| array_position([1, 2, 3, 4, 5], 10) |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

查找 null 元素：
```sql
| array_position([1, null, 3, null, 5], null) |
+---------------------------------------------+
|                                           2 |
+---------------------------------------------+
```

空数组返回 0：
```sql
SELECT array_position([], 1);
+-----------------------+
| array_position([], 1) |
+-----------------------+
|                     0 |
+-----------------------+
```

输入数组是 NULL，返回为NULL
```
SELECT array_position(NULL, 1);
+-------------------------+
| array_position(NULL, 1) |
+-------------------------+
|                    NULL |
+-------------------------+
```

日期类型查找：
```sql
SELECT array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01');
+---------------------------------------------------------------------------------------------------+
| array_position(cast(['2023-01-01', '2022-12-31', '2023-06-15'] as array<datetime>), '2023-01-01') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 1 |
+---------------------------------------------------------------------------------------------------+
```

IP 地址查找：
```sql
SELECT array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), '192.168.1.2') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 2 |
+---------------------------------------------------------------------------------------------------+

SELECT array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0');
+---------------------------------------------------------------------------------------------------+
| array_position(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::0'] AS ARRAY<IPV6>), '2001:db8::0') |
+---------------------------------------------------------------------------------------------------+
|                                                                                                 3 |
+---------------------------------------------------------------------------------------------------+
```

复杂类型示例：

嵌套数组类型不支持，报错：
```sql
SELECT array_position([[1,2], [3,4], [5,6]], [3,4]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<ARRAY<TINYINT>>, expression is array_position([[1, 2], [3, 4], [5, 6]])
```

map 类型查找：
```sql
SELECT array_position([{'k':1}, {'k':2}, {'k':3}], {'k':2});
ERROR 1105 (HY000): errCode = 2, detailMessage = array_position does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_position([map('k', 1), map('k', 2), map('k', 3)])
```

参数数量错误会报错：
```sql
SELECT array_position([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_position' which has 1 arity. Candidate functions are: [array_position(Expression, Expression)]
```

传入非数组类型时会报错：
```sql
SELECT array_position('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_position(VARCHAR(12), TINYINT)
```

### Keywords

ARRAY, POSITION, ARRAY_POSITION
