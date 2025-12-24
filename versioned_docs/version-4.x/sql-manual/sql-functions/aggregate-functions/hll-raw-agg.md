---
{
    "title": "HLL_RAW_AGG",
    "language": "en",
    "description": "The HLLRAWAGG function is an aggregate function mainly used to merge multiple HyperLogLog data structures into one."
}
---

## Description

The HLL_RAW_AGG function is an aggregate function mainly used to merge multiple HyperLogLog data structures into one.

## Alias

- HLL_UNION

## Syntax

```sql
HLL_RAW_AGG(<hll>)
HLL_UNION(<hll>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<hll>` | The expression to be calculated, type HLL supported. |

## Return Value

Returns the aggregated HLL type.
If there is no valid data in the group, returns HLL_EMPTY.

## Example

```sql
-- setup
create table test_uv(
    id int,
    uv_set string
) distributed by hash(id) buckets 1
properties ("replication_num"="1");
insert into test_uv values
    (1, ('a')),
    (1, ('b')),
    (2, ('c')),
    (2, ('d')),
    (3, null);
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              4 |
+------------------------------------------------+
```

```sql
select HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) from test_uv where uv_set is null;
```

```text
+------------------------------------------------+
| HLL_CARDINALITY(HLL_RAW_AGG(hll_hash(uv_set))) |
+------------------------------------------------+
|                                              0 |
+------------------------------------------------+
```