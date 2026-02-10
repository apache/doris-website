---
{
    "title": "ENDS_WITH",
    "language": "en"
}
---

## ends_with
### Description
#### Syntax

`BOOLEAN ENDS_WITH(VARCHAR str, VARCHAR suffix)`

It returns true if the string ends with the specified suffix, otherwise it returns false. 
If any parameter is NULL, it returns NULL.

### example

```
mysql> select ends_with("Hello doris", "doris");
+-----------------------------------+
| ends_with('Hello doris', 'doris') |
+-----------------------------------+
|                                 1 | 
+-----------------------------------+

mysql> select ends_with("Hello doris", "Hello");
+-----------------------------------+
| ends_with('Hello doris', 'Hello') |
+-----------------------------------+
|                                 0 | 
+-----------------------------------+
```
### keywords
    ENDS_WITH
