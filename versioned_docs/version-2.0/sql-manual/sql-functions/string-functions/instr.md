---
{
    "title": "INSTR",
    "language": "en"
}
---

## instr
### Description
#### Syntax

`INSTR (VARCHAR STR, VARCHAR substrate)`


Returns the location where substr first appeared in str (counting from 1). If substr does not appear in str, return 0.

### example

```
mysql> select instr("abc", "b");
+-------------------+
| instr('abc', 'b') |
+-------------------+
|                 2 |
+-------------------+

mysql> select instr("abc", "d");
+-------------------+
| instr('abc', 'd') |
+-------------------+
|                 0 |
+-------------------+
```
### keywords
    INSTR
