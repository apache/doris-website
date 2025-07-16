---
{
    "title": "STRLEFT",
    "language": "en"
}
---

## strleft
### Description
#### Syntax

`VARCHAR STRLEFT (VARCHAR str, INT len)`


It returns the left part of a string of specified length, length is char length not the byte size. Another alias for this function is [left](./left.md).

### example

```
mysql> select strleft("Hello doris",5);
+------------------------+
| strleft('Hello doris', 5) |
+------------------------+
| Hello                  |
+------------------------+
```
### keywords
    STRLEFT
