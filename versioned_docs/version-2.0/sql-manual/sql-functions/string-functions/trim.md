---
{
    "title": "TRIM",
    "language": "en"
}
---

## trim
### description
#### Syntax

`VARCHAR trim(VARCHAR str[, VARCHAR rhs])`


When the 'rhs' parameter is not present, remove the continuous spaces that appear from the starting and ending of the 'str' parameter. Otherwise, remove 'rhs'.

### example

```
mysql> SELECT trim('   ab d   ') str;
+------+
| str  |
+------+
| ab d |
+------+

mysql> SELECT trim('ababccaab','ab') str;
+------+
| str  |
+------+
| cca  |
+------+
```
### keywords
    TRIM
