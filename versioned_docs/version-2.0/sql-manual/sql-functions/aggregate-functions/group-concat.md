---
{
    "title": "GROUP_CONCAT",
    "language": "en"
}
---

## GROUP_CONCAT
### description
#### Syntax

`VARCHAR GROUP_CONCAT([DISTINCT] VARCHAR str[, VARCHAR sep] [ORDER BY { col_name | expr} [ASC | DESC]])`


This function is an aggregation function similar to sum (), and group_concat links multiple rows of results in the result set to a string. The second parameter, sep, is a connection symbol between strings, which can be omitted. This function usually needs to be used with group by statements.

Support Order By for sorting multi-row results, sorting and aggregation columns can be different.

:::caution
`group_concat` don't support using `distinct` with `order by` together.
:::

### example

```
mysql> select value from test;
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+

mysql> select GROUP_CONCAT(value) from test;
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c              |
+-----------------------+

mysql> select GROUP_CONCAT(value, " ") from test;
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                     |
+----------------------------+

mysql> select GROUP_CONCAT(DISTINCT value) from test;
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+

mysql> select GROUP_CONCAT(value, NULL) from test;
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```

### keywords
GROUP_CONCAT,GROUP,CONCAT
