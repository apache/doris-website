---
{
    "title": "NVL",
    "language": "en"
}
---

## nvl

nvl

### description
#### Syntax

`nvl(expr1, expr2)`


If the value of expr1 is not null, expr1 is returned, otherwise expr2 is returned

### example

```
mysql> select nvl(1,0);
+--------------+
| nvl(1, 0) |
+--------------+
|            1 |
+--------------+

mysql> select nvl(null,10);
+------------------+
| nvl(NULL, 10) |
+------------------+
|               10 |
+------------------+
```
### keywords
NVL
