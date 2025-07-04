---
{
    "title": "CONCAT_WS",
    "language": "en"
}
---

## concat_ws
### Description
#### Syntax

```sql
VARCHAR concat_ws(VARCHAR sep, VARCHAR str,...)
VARCHAR concat_ws(VARCHAR sep, ARRAY array)
```

Using the first parameter SEP as a connector, the second parameter and all subsequent parameters(or all string in an ARRAY) are spliced into a string.
If the separator is NULL, return NULL.
The `concat_ws` function does not skip empty strings, it skips NULL values.

### example

```
mysql> select concat_ws("or", "d", "is");
+----------------------------+
| concat_ws('or', 'd', 'is') |
+----------------------------+
| doris                      |
+----------------------------+

mysql> select concat_ws(NULL, "d", "is");
+----------------------------+
| concat_ws(NULL, 'd', 'is') |
+----------------------------+
| NULL                       |
+----------------------------+

mysql> select concat_ws("or", "d", NULL,"is");
+---------------------------------+
| concat_ws("or", "d", NULL,"is") |
+---------------------------------+
| doris                           |
+---------------------------------+

mysql> select concat_ws("or", ["d", "is"]);
+-----------------------------------+
| concat_ws('or', ARRAY('d', 'is')) |
+-----------------------------------+
| doris                             |
+-----------------------------------+

mysql> select concat_ws(NULL, ["d", "is"]);
+-----------------------------------+
| concat_ws(NULL, ARRAY('d', 'is')) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

mysql> select concat_ws("or", ["d", NULL,"is"]);
+-----------------------------------------+
| concat_ws('or', ARRAY('d', NULL, 'is')) |
+-----------------------------------------+
| doris                                   |
+-----------------------------------------+
```
### keywords
    CONCAT_WS,CONCAT,WS,ARRAY
