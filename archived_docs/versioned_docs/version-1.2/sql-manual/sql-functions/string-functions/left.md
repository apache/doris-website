---
{
    "title": "LEFT",
    "language": "en"
}
---

## left
### Description
#### Syntax

`VARCHAR left (VARCHAR str, INT len)`


It returns the left part of a string of specified length, length is char length not the byte size. Another alias for this function is [strleft](./strleft.md).

### example

```
mysql> select left("Hello doris",5);
+------------------------+
| left('Hello doris', 5) |
+------------------------+
| Hello                  |
+------------------------+
```
### keywords
    LEFT
