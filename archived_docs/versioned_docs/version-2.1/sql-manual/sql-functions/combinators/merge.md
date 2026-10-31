---
{
    "title": "MERGE",
    "language": "en",
    "description": "The aggregated intermediate results are aggregated and calculated to obtain the actual result."
}
---

## Description

The aggregated intermediate results are aggregated and calculated to obtain the actual result.
The type of the result is consistent with `AGGREGATE_FUNCTION`.

## Syntax

`AGGREGATE_FUNCTION_MERGE(agg_state)`

## Example
```
mysql [test]>select avg_merge(avg_state(1)) from d_table;
+-------------------------+
| avg_merge(avg_state(1)) |
+-------------------------+
|                       1 |
+-------------------------+
```
### Keywords
AGG_STATE, MERGE
