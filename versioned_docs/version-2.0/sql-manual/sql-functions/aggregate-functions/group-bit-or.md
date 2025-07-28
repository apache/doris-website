---
{
    "title": "GROUP_BIT_OR",
    "language": "en"
}
---

## group_bit_or
### description
#### Syntax

`expr GROUP_BIT_OR(expr)`

Perform an or calculation on expr, and return a new expr.
All ints are supported

### example

```
mysql> select * from group_bit;
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
4 rows in set (0.02 sec)

mysql> select group_bit_or(value) from group_bit;
+-----------------------+
| group_bit_or(`value`) |
+-----------------------+
|                     7 |
+-----------------------+
```

### keywords

    GROUP_BIT_OR,BIT
