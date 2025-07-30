---
{
    "title": "SUBSTRING",
    "language": "en"
}
---

## substring
### description
#### Syntax

`VARCHAR substring(VARCHAR str, INT pos[, INT len])`

The forms without a `len` argument return a substring from string `str` starting at position `pos`. 
The forms with a `len` argument return a substring len characters long from string `str`, starting at position pos. 
It is also possible to use a negative value for `pos`. In this case, 
the beginning of the substring is `pos` characters from the end of the string, rather than the beginning. 
A negative value may be used for `pos` in any of the forms of this function. 
A value of 0 for `pos` returns an empty string.

For all forms of SUBSTRING(), 
the position of the first character in the string from which the substring is to be extracted is reckoned as 1.

If len is less than 1, the result is the empty string.

### example

```
mysql> select substring('abc1', 2);
+-----------------------------+
| substring('abc1', 2)        |
+-----------------------------+
| bc1                         |
+-----------------------------+

mysql> select substring('abc1', -2);
+-----------------------------+
| substring('abc1', -2)       |
+-----------------------------+
| c1                          |
+-----------------------------+

mysql> select substring('abc1', 0);
+----------------------+
| substring('abc1', 0) |
+----------------------+
|                      |
+----------------------+

mysql> select substring('abc1', 5);
+-----------------------------+
| substring('abc1', 5)        |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> select substring('abc1def', 2, 2);
+-----------------------------+
| substring('abc1def', 2, 2)  |
+-----------------------------+
| bc                          |
+-----------------------------+
```

### keywords
    SUBSTRING, STRING
