---
{
    "title": "NAMED_STRUCT",
    "language": "zh-CN"
}
---

## named_struct

named_struct

## 描述

## 语法

`STRUCT<T1, T2, T3, ...> named_struct({VARCHAR, T1}, {VARCHAR, T2}, ...)`

根据给定的字符串和值构造并返回struct

参数个数必须为非0偶数，奇数位是field的名字，必须为常量字符串，偶数位是field的值，可以是多列或常量

## 举例

```
mysql> select named_struct('f1', 1, 'f2', 'a', 'f3', "abc");
+-----------------------------------------------+
| named_struct('f1', 1, 'f2', 'a', 'f3', 'abc') |
+-----------------------------------------------+
| {1, 'a', 'abc'}                               |
+-----------------------------------------------+
1 row in set (0.01 sec)

mysql> select named_struct('a', null, 'b', "v");
+-----------------------------------+
| named_struct('a', NULL, 'b', 'v') |
+-----------------------------------+
| {NULL, 'v'}                       |
+-----------------------------------+
1 row in set (0.01 sec)

mysql> select named_struct('f1', k1, 'f2', k2, 'f3', null) from test_tb;
+--------------------------------------------------+
| named_struct('f1', `k1`, 'f2', `k2`, 'f3', NULL) |
+--------------------------------------------------+
| {1, 'a', NULL}                                   |
+--------------------------------------------------+
1 row in set (0.02 sec)
```

### keywords

NAMED, STRUCT, NAMED_STRUCT