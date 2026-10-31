---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "en"
}
---

## not_null_or_empty
### description
#### Syntax

`BOOLEAN NOT_NULL_OR_EMPTY (VARCHAR str)`

It returns false if the string is an empty string or NULL. Otherwise it returns true.

### example

```
MySQL [(none)]> select not_null_or_empty(null);
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+

MySQL [(none)]> select not_null_or_empty("");
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+

MySQL [(none)]> select not_null_or_empty("a");
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```
### keywords
    NOT_NULL_OR_EMPTY
