---
{
    "title": "FOREACH",
    "language": "en",
    "description": "Converts an aggregate function for tables into an aggregate function for arrays that aggregates the corresponding array items and returns an array of "
}
---

## Description

Converts an aggregate function for tables into an aggregate function for arrays that aggregates the corresponding array items and returns an array of results. For example, sum_foreach for the arrays [1, 2], [3, 4, 5]and[6, 7]returns the result [10, 13, 5] after adding together the corresponding array items.

## Syntax

`AGGREGATE_FUNCTION_FOREACH(arg...)`

## Example
```
mysql [test]>select a , s from db;
+-----------+---------------+
| a         | s             |
+-----------+---------------+
| [1, 2, 3] | ["ab", "123"] |
| [20]      | ["cd"]        |
| [100]     | ["efg"]       |
| NULL      | NULL          |
| [null, 2] | [null, "c"]   |
+-----------+---------------+

mysql [test]>select sum_foreach(a) from db;
+----------------+
| sum_foreach(a) |
+----------------+
| [121, 4, 3]    |
+----------------+

mysql [test]>select count_foreach(s) from db;
+------------------+
| count_foreach(s) |
+------------------+
| [3, 2]           |
+------------------+

mysql [test]>select array_agg_foreach(a) from db;
+-----------------------------------+
| array_agg_foreach(a)              |
+-----------------------------------+
| [[1, 20, 100, null], [2, 2], [3]] |
+-----------------------------------+

mysql [test]>select map_agg_foreach(a,a) from db;
+---------------------------------------+
| map_agg_foreach(a, a)                 |
+---------------------------------------+
| [{1:1, 20:20, 100:100}, {2:2}, {3:3}] |
+---------------------------------------+
```
## Notes

- Each argument must be an ARRAY whose element type matches the corresponding argument of the nested aggregate function. The result is an ARRAY of the nested function's return type, computed position by position.
- When a single call passes multiple array arguments, all arrays in the same row must have the same length; otherwise the query fails with `Arrays passed to <function> aggregate function have different sizes`. (Array lengths may differ across rows.)
- The `percentile`, `percentile_array`, `percentile_approx`, and `percentile_approx_weighted` functions are not supported with the `foreach` combinator.

### Keywords
FOREACH