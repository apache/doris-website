---
{
    "title": "GROUP_BIT_AND",
    "language": "en"
}
---

## group_bit_and
### description
#### Syntax

`expr GROUP_BIT_AND(expr)`

Perform an and calculation on expr, and return a new expr.
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

mysql> select group_bit_and(value) from group_bit;
+------------------------+
| group_bit_and(`value`) |
+------------------------+
|                      0 |
+------------------------+
```

### keywords

    GROUP_BIT_AND,BIT
