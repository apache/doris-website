---
{
    "title": "STRUCT",
    "language": "en"
}
---

## struct()

:::tip Tips
This function is supported since the Apache Doris 2.0 version
:::

struct()



### description

#### Syntax

`STRUCT<T1, T2, T3, ...> struct(T1, T2, T3, ...)`

construct an struct with variadic elements and return it, Tn could be column or literal

### example

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

STRUCT,CONSTRUCTOR