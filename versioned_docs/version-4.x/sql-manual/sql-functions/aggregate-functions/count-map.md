---
{
    "title": "COUNT_MAP",
    "language": "en",
    "description": "The COUNT_MAP function aggregates MAP values by key and returns the count of non-NULL values for each key."
}
---

## Description

The COUNT_MAP function aggregates MAP values by key and returns a MAP that contains the count of non-NULL values for each key.

## Usage Notes

The order of entries in the returned MAP is not guaranteed. Use `map_keys`, `map_values`, `array_sort`, and `array_sortby` when stable output order is required. A NULL key is aggregated as a regular key; all NULL keys belong to the same result entry.

## Syntax

```sql
COUNT_MAP(<map_expr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<map_expr>` | A MAP expression. |

## Return Value

Returns a MAP with the same key type as `<map_expr>` and BIGINT values.

If there is no valid input row in the group, returns an empty MAP. If a key appears but all values for that key are NULL, the value for that key is 0.

## Example

```sql
-- setup
CREATE TABLE map_agg_example (
    id INT,
    m MAP<INT, INT>,
    ms MAP<INT, STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO map_agg_example VALUES
    (1, MAP(1, 10, 2, 20), MAP(1, 'b', 2, 'x')),
    (1, MAP(2, 5, 3, 30), MAP(1, 'a', 3, NULL)),
    (2, MAP(1, 7, 4, NULL), MAP(2, 'z')),
    (2, CAST(MAP() AS MAP<INT, INT>), CAST(MAP() AS MAP<INT, STRING>));
```

```text
Query OK
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(m) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [1, 2, 1] |
|    2 | [1, 4]    | [1, 0]    |
+------+-----------+-----------+
```

```sql
SELECT id,
       array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT id, COUNT_MAP(ms) AS result
    FROM map_agg_example
    GROUP BY id
) t
ORDER BY id;
```

```text
+------+-----------+-----------+
| id   | keys      | values    |
+------+-----------+-----------+
|    1 | [1, 2, 3] | [2, 1, 0] |
|    2 | [2]       | [1]       |
+------+-----------+-----------+
```

```sql
SELECT array_sort(map_keys(result)) AS keys,
       array_sortby(map_values(result), map_keys(result)) AS values
FROM (
    SELECT COUNT_MAP(m) AS result
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
