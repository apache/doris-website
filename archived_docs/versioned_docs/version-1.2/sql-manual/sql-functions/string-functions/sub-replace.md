---
{
"title": "SUB_REPLACE",
"language": "en"
}
---

## sub_replace
### Description
#### Syntax

`VARCHAR sub_replace(VARCHAR str, VARCHAR new_str, INT start[, INT len])`

Return with new_str replaces the str with length and starting position from start.
When start and len are negative integers, return NULL.
and the default value of len is the length of new_str.

### example

```
mysql> select sub_replace("this is origin str","NEW-STR",1);
+-------------------------------------------------+
| sub_replace('this is origin str', 'NEW-STR', 1) |
+-------------------------------------------------+
| tNEW-STRorigin str                              |
+-------------------------------------------------+

mysql> select sub_replace("doris","***",1,2);
+-----------------------------------+
| sub_replace('doris', '***', 1, 2) |
+-----------------------------------+
| d***is                            |
+-----------------------------------+
```
### keywords
    SUB_REPLACE
