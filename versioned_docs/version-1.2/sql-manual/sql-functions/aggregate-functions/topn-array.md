---
{
    "title": "TOPN_ARRAY",
    "language": "en"
}
---

## TOPN_ARRAY
### description
#### Syntax

`ARRAY<T> topn_array(expr, INT top_num[, INT space_expand_rate])`

The topn function uses the Space-Saving algorithm to calculate the top_num frequent items in expr, 
and return an array about the top n nums, which is an approximation

The space_expand_rate parameter is optional and is used to set the number of counters used in the Space-Saving algorithm
```
counter numbers = top_num * space_expand_rate
```
The higher value of space_expand_rate, the more accurate result will be. The default value is 50

### example
```
mysql> select topn_array(k3,3) from baseall;
+--------------------------+
| topn_array(`k3`, 3)      |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)

mysql> select topn_array(k3,3,100) from baseall;
+--------------------------+
| topn_array(`k3`, 3, 100) |
+--------------------------+
| [3021, 2147483647, 5014] |
+--------------------------+
1 row in set (0.02 sec)
```
### keywords
TOPN, TOPN_ARRAY