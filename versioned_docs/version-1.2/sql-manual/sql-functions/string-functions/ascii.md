---
{
    "title": "ASCII",
    "language": "en"
}
---

## ascii
### Description
#### Syntax

`INT AXES (WARCHAR STR)`


Returns the ASCII code corresponding to the first character of the string

### example

```
mysql> select ascii('1');
+------------+
| ascii('1') |
+------------+
|         49 |
+------------+

mysql> select ascii('234');
+--------------+
| ascii('234') |
+--------------+
|           50 |
+--------------+
```
### keywords
    ASCII
