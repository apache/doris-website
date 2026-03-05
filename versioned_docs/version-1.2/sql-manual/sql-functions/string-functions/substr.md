---
{
"title": "SUBSTR",
"language": "en"
}
---

## substr
### Description
#### Syntax

`VARCHAR substr(VARCHAR content, INT start, INT length)`

Find a substring, return the part of the string described by the first parameter starting from start and having a length of len. The index of the first letter is 1.

### example

```
mysql> select substr("Hello doris", 2, 1);
+-----------------------------+
| substr('Hello doris', 2, 1) |
+-----------------------------+
| e                           |
+-----------------------------+
mysql> select substr("Hello doris", 1, 2);
+-----------------------------+
| substr('Hello doris', 1, 2) |
+-----------------------------+
| He                          |
+-----------------------------+
```
### keywords
    SUBSTR
