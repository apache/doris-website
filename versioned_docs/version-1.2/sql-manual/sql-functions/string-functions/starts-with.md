---
{
    "title": "STARTS_WITH",
    "language": "en"
}
---

## starts_with
### Description
#### Syntax

`BOOLEAN STARTS_WITH(VARCHAR str, VARCHAR prefix)`

It returns true if the string starts with the specified prefix, otherwise it returns false.
If any parameter is NULL, it returns NULL.

### example

```
MySQL [(none)]> select starts_with("hello world","hello");
+-------------------------------------+
| starts_with('hello world', 'hello') |
+-------------------------------------+
|                                   1 |
+-------------------------------------+

MySQL [(none)]> select starts_with("hello world","world");
+-------------------------------------+
| starts_with('hello world', 'world') |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```
### keywords
    STARTS_WITH
