---
{
    "title": "HLL_EMPTY",
    "language": "en"
}
---

## Description

`HLL_EMPTY` returns an empty HLL (HyperLogLog) value, representing a data set with no elements.

## Syntax

```sql
HLL_EMPTY()
```

## Return Value

Returns an empty HLL type value, representing a data set with no elements.

## Example

```sql
select hll_cardinality(hll_empty());
```

```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```