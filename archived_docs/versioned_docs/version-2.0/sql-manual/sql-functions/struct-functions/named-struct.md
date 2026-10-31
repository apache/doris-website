---
{
    "title": "NAMED_STRUCT",
    "language": "en"
}
---

## named_struct

named_struct

### description

#### Syntax

`STRUCT<T1, T2, T3, ...> named_struct({VARCHAR, T1}, {VARCHAR, T2}, ...)`

Construct a struct with the given field names and values. 

The number of parameters must be non zero and even. With odd digits being the name of the field and could be string literal, with even digits being the value of the field and could be column or literal.

### example

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
