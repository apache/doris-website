---
{
    "title": "HLL_CARDINALITY",
    "language": "en"
}
---

## Description

`HLL_CARDINALITY` calculates the cardinality of a HyperLogLog (HLL) type value. It is an approximate counting algorithm suitable for estimating the number of distinct elements in large datasets.

## Syntax

```sql
HLL_CARDINALITY(<hll>)
```

## Parameters

| Parameter  | Description                                              |
| ---------- | -------------------------------------------------------- |
| `<hll>`    | The HLL type value representing the dataset whose cardinality needs to be estimated. |

## Return Value

Returns the estimated cardinality of the HLL type value, representing the number of distinct elements in the dataset.

## Example

```sql
select HLL_CARDINALITY(uv_set) from test_uv;
```

```text
+---------------------------+
| hll_cardinality(`uv_set`) |
+---------------------------+
|                         3 |
+---------------------------+
```