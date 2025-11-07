---
{
    "title": "GROUP_BIT_XOR",
    "language": "en"
}
---

## group_bit_xor
### description
#### Syntax

`expr GROUP_BIT_XOR(expr)`

Perform an xor calculation on expr, and return a new expr.
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

mysql> select group_bit_xor(value) from group_bit;
+------------------------+
| group_bit_xor(`value`) |
+------------------------+
|                      4 |
+------------------------+
```

### keywords

    GROUP_BIT_XOR,BIT
