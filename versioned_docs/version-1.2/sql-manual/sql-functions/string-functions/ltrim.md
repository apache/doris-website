---
{
    "title": "LTRIM",
    "language": "en"
}
---

## ltrim
### Description
#### Syntax

`VARCHAR ltrim(VARCHAR str[, VARCHAR rhs])`


When the 'rhs' parameter is not present, remove the continuous spaces that appear from the beginning of the 'str' parameter. Otherwise, remove 'rhs'.

### example

```
mysql> SELECT ltrim('   ab d');
+------------------+
| ltrim('   ab d') |
+------------------+
| ab d             |
+------------------+

mysql> SELECT ltrim('ababccaab','ab') str;
+-------+
| str   |
+-------+
| ccaab |
+-------+
```
### keywords
    LTRIM
