---
{
    "title": "HLL_UNION_AGG",
    "language": "en",
    "description": "The HLLUNIONAGG function is an aggregate function mainly used to merge multiple HyperLogLog data structures and estimate the approximate cardinality "
}
---

## Description

The HLL_UNION_AGG function is an aggregate function mainly used to merge multiple HyperLogLog data structures and estimate the approximate cardinality after merging.

## Syntax

```sql
hll_union_agg(<hll>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<hll>` | The expression to be calculated, type HLL supported. |

## Return Value

Returns a BIGINT cardinality value.
If there is no valid data in the group, returns 0.

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
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select HLL_UNION_AGG(HLL_HASH(uv_set)) from test_uv where uv_set is null;
```

```text
+---------------------------------+
| HLL_UNION_AGG(HLL_HASH(uv_set)) |
+---------------------------------+
|                               0 |
+---------------------------------+
```