---
{
    "title": "HLL_HASH",
    "language": "en",
    "description": "Converts a given value to the HLL (HyperLogLog) type. This function is typically used during data loading to create an HLL from raw data."
}
---

## Description

Converts a given value to the HLL (HyperLogLog) type. This function is typically used during data loading to create an HLL from raw data.

## Syntax

```sql
HLL_HASH(<value>)
```

## Parameters

| Parameter | Description                                                   |
|-----------|---------------------------------------------------------------|
| `<value>` | The value to be converted to HLL type. This can be a string, number, or any data type. |

## Examples

```sql
SELECT HLL_CARDINALITY(HLL_HASH('abc'));
```

```text
+----------------------------------+
| hll_cardinality(HLL_HASH('abc')) |
+----------------------------------+
|                                1 |
+----------------------------------+
```
