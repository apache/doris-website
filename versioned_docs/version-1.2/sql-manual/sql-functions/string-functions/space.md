---
{
    "title": "SPACE",
    "language": "en"
}
---

## space
### Description
#### Syntax

`VARCHAR space(Int num)`

Returns a string consisting of num spaces.

### example

```
mysql> select length(space(10));
+-------------------+
| length(space(10)) |
+-------------------+
|                10 |
+-------------------+
1 row in set (0.01 sec)

mysql> select length(space(-10));
+--------------------+
| length(space(-10)) |
+--------------------+
|                  0 |
+--------------------+
1 row in set (0.02 sec)
```
### keywords
    space
