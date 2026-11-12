---
{
    "title": "STRRIGHT",
    "language": "en"
}
---

## strright
### Description
#### Syntax

`VARCHAR strright (VARCHAR str, INT len)`


It returns the right part of a string of specified length, length is char length not the byte size. Another alias for this function is [right](./right.md).

### example

```
mysql> select strright("Hello doris",5);
+-------------------------+
| strright('Hello doris', 5) |
+-------------------------+
| doris                   |
+-------------------------+
```
### keywords
    STRRIGHT
