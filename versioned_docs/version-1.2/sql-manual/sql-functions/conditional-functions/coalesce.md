---
{
    "title": "COALESCE",
    "language": "en"
}
---

## coalesce
### description
#### Syntax

`coalesce(expr1, expr2, ...., expr_n)`


Returns the first non empty expression in the parameter (from left to right)

### example

```
mysql> select coalesce(NULL, '1111', '0000');
+--------------------------------+
| coalesce(NULL, '1111', '0000') |
+--------------------------------+
| 1111                           |
+--------------------------------+
```
### keywords
COALESCE
