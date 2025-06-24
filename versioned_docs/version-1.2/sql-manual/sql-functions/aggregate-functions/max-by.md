---
{
    "title": "MAX_BY",
    "language": "en"
}
---

## MAX_BY
### description
#### Syntax

`MAX_BY(expr1, expr2)`


Returns the value of an expr1 associated with the maximum value of expr2 in a group.

### example
```
MySQL > select * from tbl;
+------+------+------+------+
| k1   | k2   | k3   | k4   |
+------+------+------+------+
|    0 | 3    | 2    |  100 |
|    1 | 2    | 3    |    4 |
|    4 | 3    | 2    |    1 |
|    3 | 4    | 2    |    1 |
+------+------+------+------+

MySQL > select max_by(k1, k4) from tbl;
+--------------------+
| max_by(`k1`, `k4`) |
+--------------------+
|                  0 |
+--------------------+ 
```
### keywords
MAX_BY
