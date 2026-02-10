---
{
    "title": "IFNULL",
    "language": "en"
}
---

## ifnull
### description
#### Syntax

`ifnull(expr1, expr2)`


If the value of expr1 is not null, expr1 is returned, otherwise expr2 is returned

### example

```
mysql> select ifnull(1,0);
+--------------+
| ifnull(1, 0) |
+--------------+
|            1 |
+--------------+

mysql> select ifnull(null,10);
+------------------+
| ifnull(NULL, 10) |
+------------------+
|               10 |
+------------------+
```
### keywords
IFNULL
