---
{
    "title": "TOPN_WEIGHTED",
    "language": "en"
}
---

## TOPN_WEIGHTED
### description
#### Syntax

`ARRAY<T> topn_weighted(expr, BigInt weight, INT top_num[, INT space_expand_rate])`

The topn_weighted function is calculated using the Space-Saving algorithm, and the sum of the weights in expr is the result of the top n numbers, which is an approximate value

The space_expand_rate parameter is optional and is used to set the number of counters used in the Space-Saving algorithm
```
counter numbers = top_num * space_expand_rate
```
The higher value of space_expand_rate, the more accurate result will be. The default value is 50

### example
```
mysql> select topn_weighted(k5,k1,3) from baseall;
+------------------------------+
| topn_weighted(`k5`, `k1`, 3) |
+------------------------------+
| [0, 243.325, 100.001]        |
+------------------------------+
1 row in set (0.02 sec)

mysql> select topn_weighted(k5,k1,3,100) from baseall;
+-----------------------------------+
| topn_weighted(`k5`, `k1`, 3, 100) |
+-----------------------------------+
| [0, 243.325, 100.001]             |
+-----------------------------------+
1 row in set (0.02 sec)
```
### keywords
TOPN, TOPN_WEIGHTED