---
{
    "title": "LOWER",
    "language": "en"
}
---

## lower
### Description
#### Syntax

`VARCHAR lower (VARCHAR str)`


Convert all strings in parameters to lowercase. Another alias for this function is [lcase](lcase.md).

### example

```
mysql> SELECT lower("AbC123");
+-----------------+
| lower('AbC123') |
+-----------------+
| abc123          |
+-----------------+
```
### keywords
    LOWER
