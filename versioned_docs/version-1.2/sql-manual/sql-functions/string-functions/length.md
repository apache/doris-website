---
{
    "title": "LENGTH",
    "language": "en"
}
---

## length
### Description
#### Syntax

`INT length (VARCHAR str)`


Returns the length of the string in byte size.

### example

```
mysql> select length("abc");
+---------------+
| length('abc') |
+---------------+
|             3 |
+---------------+

mysql> select length("中国");
+------------------+
| length('中国')   |
+------------------+
|                6 |
+------------------+
```
### keywords
    LENGTH
