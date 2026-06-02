---
{
    "title": "HLL_CARDINALITY",
    "language": "en",
    "description": "HLLCARDINALITY calculates the cardinality of a HyperLogLog (HLL) type value."
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

<!-- setup-sql
CREATE TABLE test_uv (id INT, uv_set HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_uv VALUES (1, hll_hash('a')), (1, hll_hash('b')), (1, hll_hash('c'));
-->

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