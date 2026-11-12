---
{
    "title": "MIN_BY",
    "language": "en"
}
---

## MIN_BY
### description
#### Syntax

`MIN_BY(expr1, expr2)`


Returns the value of an expr1 associated with the minimum value of expr2 in a group.

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

MySQL > select min_by(k1, k4) from tbl;
+--------------------+
| min_by(`k1`, `k4`) |
+--------------------+
|                  4 |
+--------------------+ 
```
### keywords
MIN_BY
