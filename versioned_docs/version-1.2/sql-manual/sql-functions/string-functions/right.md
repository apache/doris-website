---
{
    "title": "RIGHT",
    "language": "en"
}
---

## right
### Description
#### Syntax

`VARCHAR RIGHT (VARCHAR str, INT len)`


It returns the right part of a string of specified length, length is char length not the byte size. Another alias for this function is [strright](./strright.md).

### example

```
mysql> select right("Hello doris",5);
+-------------------------+
| right('Hello doris', 5) |
+-------------------------+
| doris                   |
+-------------------------+
```
### keywords
    RIGHT
