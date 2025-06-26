---
{
    "title": "CONCAT",
    "language": "en"
}
---

## concat
### Description
#### Syntax

`VARCHAR concat (VARCHAR,...)`


Connect multiple strings and return NULL if any of the parameters is NULL

### example

```
mysql> select concat("a", "b");
+------------------+
| concat('a', 'b') |
+------------------+
| ab               |
+------------------+

mysql> select concat("a", "b", "c");
+-----------------------+
| concat('a', 'b', 'c') |
+-----------------------+
| abc                   |
+-----------------------+

mysql> select concat("a", null, "c");
+------------------------+
| concat('a', NULL, 'c') |
+------------------------+
| NULL                   |
+------------------------+
```
### keywords
    CONCAT
