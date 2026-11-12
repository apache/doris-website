---
{
    "title": "HLL_UNION_AGG",
    "language": "en",
    "description": "The HLLUNIONAGG function is an aggregate function, which is mainly used to merge multiple HyperLogLog data structures and estimate the approximate "
}
---

## Description

The HLL_UNION_AGG function is an aggregate function, which is mainly used to merge multiple HyperLogLog data structures and estimate the approximate value of the combined cardinality.

## Syntax

```sql
hll_union_agg(<hll>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<hll>` | The HyperLogLog type expression to be calculated |

## Return Value

Returns the cardinality value of type BIGINT.

## Example

```sql
select HLL_UNION_AGG(uv_set) from test_uv;
```

```text
+-------------------------+
| HLL_UNION_AGG(`uv_set`) |
+-------------------------+
| 17721                   |
+-------------------------+
```