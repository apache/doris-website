---
{
    "title": "UNHEX",
    "language": "en"
}
---

## unhex
### description
#### Syntax

`VARCHAR unhex(VARCHAR str)`

Enter a string, if the length of the string is 0 or an odd number, an empty string is returned;
If the string contains characters other than `[0-9], [a-f], [A-F]`, an empty string is returned;
In other cases, every two characters are a group of characters converted into hexadecimal, and then spliced into a string for output.


### example

```
mysql> select unhex('@');
+------------+
| unhex('@') |
+------------+
|            |
+------------+

mysql> select unhex('41');
+-------------+
| unhex('41') |
+-------------+
| A           |
+-------------+

mysql> select unhex('4142');
+---------------+
| unhex('4142') |
+---------------+
| AB            |
+---------------+
```
### keywords
    UNHEX
