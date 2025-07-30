---
{
    "title": "BIT_LENGTH",
    "language": "en"
}
---

## bit_length
### Description
#### Syntax

`INT bit_length (VARCHAR str)`


Return length of argument in bits.

### example

```
mysql> select bit_length("abc");
+-------------------+
| bit_length('abc') |
+-------------------+
|                24 |
+-------------------+

mysql> select bit_length("中国");
+----------------------+
| bit_length('中国')    |
+----------------------+
|                   48 |
+----------------------+
```
### keywords
    BIT_LENGTH
