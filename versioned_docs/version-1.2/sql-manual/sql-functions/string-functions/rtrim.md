---
{
    "title": "RTRIM",
    "language": "en"
}
---

## rtrim
### description
#### Syntax

`VARCHAR rtrim(VARCHAR str[, VARCHAR rhs])`


When the 'rhs' parameter is not present, remove the continuous spaces that appear from the ending of the 'str' parameter. Otherwise, remove 'rhs'.

### example

```
mysql> SELECT rtrim('ab d   ') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT rtrim('ababccaab','ab') str;
+---------+
| str     |
+---------+
| ababcca |
+---------+
```
### keywords
    RTRIM
