---
{
    "title": "CHAR_LENGTH",
    "language": "en"
}
---

## char_length
### Description
#### Syntax

INT char_length(VARCHAR str)


Returns the length of the string, and the number of characters returned for multi-byte characters. For example, five two-byte width words return a length of 5, only utf8 encoding is support at the current version. `character_length` is the alias for this function.

### example


```
mysql> select char_length("abc");
+--------------------+
| char_length('abc') |
+--------------------+
|                  3 |
+--------------------+

mysql> select char_length("中国");
+------------------- ---+
| char_length('中国')   |
+-----------------------+
|                     2 |
+-----------------------+
```
### keywords
    CHAR_LENGTH, CHARACTER_LENGTH
