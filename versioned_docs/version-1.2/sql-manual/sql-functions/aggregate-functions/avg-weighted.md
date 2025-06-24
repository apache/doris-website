---
{
    "title": "AVG_WEIGHTED",
    "language": "en"
}
---

## AVG_WEIGHTED
### Description
#### Syntax

` double avg_weighted(x, weight)`

Calculate the weighted arithmetic mean, which is the sum of the products of all corresponding values and weights, divided the total weight sum.
If the sum of all weights equals 0, NaN will be returned.

### example

```
mysql> select avg_weighted(k2,k1) from baseall;
+--------------------------+
| avg_weighted(`k2`, `k1`) |
+--------------------------+
|                  495.675 |
+--------------------------+
1 row in set (0.02 sec)

```
### keywords

AVG_WEIGHTED
