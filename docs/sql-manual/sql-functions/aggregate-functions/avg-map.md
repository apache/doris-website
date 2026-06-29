---
{
    "title": "AVG_MAP",
    "language": "en",
    "description": "The AVG_MAP function aggregates MAP values by key and returns the average value for each key."
}
---

## Description

The AVG_MAP function aggregates MAP values by key and returns a MAP that contains the average of non-NULL values for each key.

## Usage Notes

The order of entries in the returned MAP is not guaranteed. Use `map_keys`, `map_values`, `array_sort`, and `array_sortby` when stable output order is required. A NULL key is aggregated as a regular key; all NULL keys belong to the same result entry.

## Syntax

```sql
AVG_MAP(<map_expr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<map_expr>` | A MAP expression. The MAP value type must be numeric. |

## Return Value

Returns a MAP with the same key type as `<map_expr>`. For numeric value types other than Decimal, the returned value type is DOUBLE. For Decimal value types, the returned value type is a Decimal type with the maximum supported precision and a scale adjusted for AVG.

If there is no valid input row in the group, returns an empty MAP. If a key appears but all values for that key are NULL, the value for that key is NULL.

## Example

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    md MAP<STRING, DECIMAL(10, 2)>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP('a', 1.20, 'b', 2.30)),
    (1, MAP(2, 5, 3, 30), MAP('b', 3.70, 'c', 4.00)),
    (2, MAP(1, 7, 4, NULL), MAP('a', NULL, 'c', 5.50)),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<STRING, DECIMAL(10, 2)>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, AVG_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+----------------+
| id   | keys      | values         |
+------+-----------+----------------+
|    1 | [1, 2, 3] | [10, 12.5, 30] |
|    2 | [1, 4]    | [7, null]      |
+------+-----------+----------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(md) AS result
    FROM map_agg_example
) t;
```

```text
+-----------------+------------------------+
| keys            | values                 |
+-----------------+------------------------+
| ["a", "b", "c"] | [1.2000, 3.0000, 4.7500] |
+-----------------+------------------------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT AVG_MAP(m) AS result
    FROM map_agg_example
    WHERE id = 100
) t;
```

```text
+------+--------+
| keys | values |
+------+--------+
| []   | []     |
+------+--------+
```
