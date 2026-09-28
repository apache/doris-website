---
{
    "title": "MAP_AGG",
    "language": "en",
    "description": "The MAPAGG function is used to form a mapping structure based on key-value pairs from multiple rows of data."
}
---

## Description

The MAP_AGG function is used to form a mapping structure based on key-value pairs from multiple rows of data.

For duplicate keys, `MAP_AGG` keeps the value encountered first during aggregation and ignores subsequent values for a key that already exists. When partial aggregate states are merged, the value already present in the destination state is also retained.

“Encountered first” refers to processing order, not insertion order. Scanning, parallel execution, and the order in which partial states are merged can affect which value is retained, so the value selected for a duplicate key is not guaranteed to be the same across queries. An outer `ORDER BY` only sorts result rows; it does not determine which value is retained for a duplicate key.

## Syntax

```sql
MAP_AGG(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The expression used as the key. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, String, and UUID. |
| `<expr2>` | The expression used as the value. Supported types: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, String, and UUID. |

## Return Value

Returns a value of the Map type. If there is no valid data in the group, returns an empty Map.

## Example

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```

The following query contains a duplicate key, so the result contains only one key-value pair. The result can be `{1:"a"}` or `{1:"b"}`, depending on which value is processed first. One possible output is:

```sql
SELECT MAP_AGG(k, v) AS result
FROM (
    SELECT 1 AS k, 'a' AS v
    UNION ALL
    SELECT 1 AS k, 'b' AS v
) AS input;
```

```text
+---------+
| result  |
+---------+
| {1:"a"} |
+---------+
```
