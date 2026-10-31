---
{
    "title": "RPAD",
    "language": "en"
}
---

## rpad
### Description
#### Syntax

`VARCHAR rpad (VARCHAR str, INT len, VARCHAR pad)`


Returns a string of length len in str, starting with the initials. If len is longer than str, pad characters are added to the right of STR until the length of the string reaches len. If len is less than str's length, the function is equivalent to truncating STR strings and returning only strings of len's length. The len is character length not the bye size.

Except when it contains a NULL in parameters, when pad's length is 0, the return value is the empty string.

### example

```
mysql> SELECT rpad("hi", 5, "xy");
+---------------------+
| rpad('hi', 5, 'xy') |
+---------------------+
| hixyx               |
+---------------------+

mysql> SELECT rpad("hi", 1, "xy");
+---------------------+
| rpad('hi', 1, 'xy') |
+---------------------+
| h                   |
+---------------------+

mysql> SELECT rpad("", 0, "");
+-----------------+
| rpad('', 0, '') |
+-----------------+
|                 |
+-----------------+
```

### keywords
    RPAD
