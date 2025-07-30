---
{
    "title": "UPPER",
    "language": "en"
}
---

## upper
### description
#### Syntax

`VARCHAR upper(VARCHAR str)`


Convert all strings in parameters to uppercase. Another alias for this function is [ucase](./ucase.md).

### example

```
mysql> SELECT upper("aBc123");
+-----------------+
| upper('aBc123') |
+-----------------+
| ABC123          |
+-----------------+
```
### keywords
    UPPER
