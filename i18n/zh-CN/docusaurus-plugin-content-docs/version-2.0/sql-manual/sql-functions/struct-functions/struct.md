---
{
    "title": "STRUCT",
    "language": "zh-CN"
}
---

## struct()

:::tip 提示
该功能自 Apache Doris  2.0 版本起支持
:::

struct()



## 描述

## 语法

`STRUCT<T1, T2, T3, ...> struct(T1, T2, T3, ...)`

根据给定的值构造并返回 struct，参数可以是多列或常量

## 举例

```
mysql> select struct(1, 'a', "abc");
+-----------------------+
| struct(1, 'a', 'abc') |
+-----------------------+
| {1, 'a', 'abc'}       |
+-----------------------+
1 row in set (0.03 sec)

mysql> select struct(null, 1, null);
+-----------------------+
| struct(NULL, 1, NULL) |
+-----------------------+
| {NULL, 1, NULL}       |
+-----------------------+
1 row in set (0.02 sec)

mysql> select struct(cast('2023-03-16' as datetime));
+----------------------------------------+
| struct(CAST('2023-03-16' AS DATETIME)) |
+----------------------------------------+
| {2023-03-16 00:00:00}                  |
+----------------------------------------+
1 row in set (0.01 sec)

mysql> select struct(k1, k2, null) from test_tb;
+--------------------------+
| struct(`k1`, `k2`, NULL) |
+--------------------------+
| {1, 'a', NULL}           |
+--------------------------+
1 row in set (0.04 sec)
```

### keywords

STRUCT, CONSTRUCTOR
