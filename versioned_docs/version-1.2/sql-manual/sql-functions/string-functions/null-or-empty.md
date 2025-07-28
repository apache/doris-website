---
{
    "title": "NULL_OR_EMPTY",
    "language": "en"
}
---

## null_or_empty
### description
#### Syntax

`BOOLEAN NULL_OR_EMPTY (VARCHAR str)`

It returns true if the string is an empty string or NULL. Otherwise it returns false.

### example

```
MySQL [(none)]> select null_or_empty(null);
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+

MySQL [(none)]> select null_or_empty("");
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+

MySQL [(none)]> select null_or_empty("a");
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```
### keywords
    NULL_OR_EMPTY
