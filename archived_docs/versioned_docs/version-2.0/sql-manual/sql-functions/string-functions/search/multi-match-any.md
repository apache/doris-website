---
{
    "title": "MULTI_MATCH_ANY",
    "language": "en"
}
---

## multi_match_any
### Description
#### Syntax

`TINYINT multi_match_any(VARCHAR haystack, ARRAY<VARCHAR> patterns)`


Checks whether the string `haystack` matches the regular expressions `patterns` in re2 syntax. returns 0 if none of the regular expressions are matched and 1 if any of the patterns matches.

### example

```
mysql> select multi_match_any('Hello, World!', ['hello', '!', 'world']);
+-----------------------------------------------------------+
| multi_match_any('Hello, World!', ['hello', '!', 'world']) |
+-----------------------------------------------------------+
| 1                                                         |
+-----------------------------------------------------------+

mysql> select multi_match_any('abc', ['A', 'bcd']);
+--------------------------------------+
| multi_match_any('abc', ['A', 'bcd']) |
+--------------------------------------+
| 0                                    |
+--------------------------------------+
```
### keywords
    MULTI_MATCH,MATCH,ANY
