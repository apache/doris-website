---
{
    "title": "UNION",
    "language": "en",
    "description": "Aggregate multiple aggregation intermediate results into one. The type of the result is aggstate,"
}
---

## description

Aggregate multiple aggregation intermediate results into one.
The type of the result is agg_state, and the function signature is consistent with the input parameter.

## Syntax

`AGGREGATE_FUNCTION_UNION(agg_state)`

## example
```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### keywords
AGG_STATE, UNION
