---
{
    "title": "HLL_TO_BASE64",
    "language": "en",
    "description": "Converts an input HLL to a base64-encoded string. If the input is `<null>`, the function returns `<null>`."
}
---

## Description

Converts an input HLL to a base64-encoded string. If the input is `<null>`, the function returns `<null>`.

## Syntax

```sql
HLL_TO_BASE64(<hll_input>)
```

## Parameters

| Parameter    | Description                                          |
| ------------ | ---------------------------------------------------- |
| `<hll_input>` | The HyperLogLog (HLL) data to be converted to a base64-encoded string. If the input is `<null>`, the function returns `<null>`. |

## Examples

<!-- setup-sql
CREATE TABLE test_hll (id INT, pv HLL HLL_UNION) AGGREGATE KEY(id) DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO test_hll VALUES (1, hll_hash('a')), (2, hll_hash('b')), (3, hll_hash('c'));
-->

```sql
select hll_to_base64(NULL);
```

```text
+---------------------+
| hll_to_base64(NULL) |
+---------------------+
| NULL                |
+---------------------+
```

```sql
select hll_to_base64(hll_empty());
```

```text
+----------------------------+
| hll_to_base64(hll_empty()) |
+----------------------------+
| AA==                       |
+----------------------------+
```

```sql
select hll_to_base64(hll_hash('abc'));
```

```text
+--------------------------------+
| hll_to_base64(hll_hash('abc')) |
+--------------------------------+
| AQEC5XSzrpDsdw==               |
+--------------------------------+
```

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```