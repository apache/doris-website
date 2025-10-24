---
{
    "title": "HLL_RAW_AGG",
    "language": "en"
}
---

## Description

The HLL_RAW_AGG function is an aggregate function, which is mainly used to merge multiple HyperLogLog data structures.

## Alias

- HLL_UNION

## Syntax

```sql
HLL_RAW_AGG(<hll>)
```

## Parameters

| Parameters | Description |
| -- | -- |
| `<hll>` | The HyperLogLog type expression to be calculated |

## Return Value

Returns the aggregated value of type HyperLogLog.

## Example

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(uv_set)) from test_uv;
```

```text
+------------------------------------------+
|   HLL_CARDINALITY(HLL_RAW_AGG(`uv_set`)) |
+------------------------------------------+
|                                    17721 |
+------------------------------------------+
```