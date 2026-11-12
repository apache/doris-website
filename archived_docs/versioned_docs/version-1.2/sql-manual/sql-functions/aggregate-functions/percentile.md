---
{
    "title": "PERCENTILE",
    "language": "en"
}
---

### Description
#### Syntax

`PERCENTILE(expr, DOUBLE p)`

Calculates the exact percentile for small amounts of data. The specified columns are sorted in descending order and then the exact `p` percentile is taken. The value of `p` is between `0` and `1`.
If `p` does not point to an exact position, the linear interpolation of the values adjacent to either side of the pointed position at the position pointed to by `p` is returned. Note that this is not an average of the two numbers.

Parameters:
`expr`: required. The value is an integer (`bigint` at most).
`p`: required. The const value is `[0.0,1.0]`.

### Example

```sql
MySQL > select `table`, percentile(cost_time,0.99) from log_statis group by `table`;
+---------------------+---------------------------+
| table    |         percentile(`cost_time`, 0.99)|
+----------+--------------------------------------+
| test     |                                54.22 |
+----------+--------------------------------------+

MySQL > select percentile(NULL,0.3) from table1;
+-----------------------+
| percentile(NULL, 0.3) |
+-----------------------+
|                  NULL |
+-----------------------+
```

### Keywords
    PERCENTILE
