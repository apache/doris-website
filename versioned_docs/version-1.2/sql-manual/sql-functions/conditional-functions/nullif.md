---
{
    "title": "NULLIF",
    "language": "en"
}
---

## nullif
### description
#### Syntax

`nullif(expr1, expr2)`


If the two parameters are equal, null is returned. Otherwise, the value of the first parameter is returned. It has the same effect as the following `case when`

```
CASE
     WHEN expr1 = expr2 THEN NULL
     ELSE expr1
END
```

### example

```
mysql> select nullif(1,1);
+--------------+
| nullif(1, 1) |
+--------------+
|         NULL |
+--------------+

mysql> select nullif(1,0);
+--------------+
| nullif(1, 0) |
+--------------+
|            1 |
+--------------+
```
### keywords
NULLIF
