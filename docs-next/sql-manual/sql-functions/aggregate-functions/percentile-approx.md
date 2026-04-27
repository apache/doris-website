---
{
    "title": "PERCENTILE_APPROX",
    "language": "en",
    "description": "The PERCENTILEAPPROX function is used to calculate approximate percentiles, primarily for large datasets. Compared to the PERCENTILE function,"
}
---

## Description

The `PERCENTILE_APPROX` function is used to calculate approximate percentiles, primarily for large datasets. Compared to the `PERCENTILE` function, it has the following features:

1. Memory Efficiency: Uses fixed-size memory, maintaining low memory consumption even when processing low-cardinality columns (large data volumes but the number of different elements is small)
2. Performance Advantage: Suitable for processing low-cardinality large-scale datasets with faster computation
3. Adjustable Precision: Balance between precision and performance through the compression parameter


## Syntax

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to calculate percentiles for, supported type: Double. |
| `<p>` | Percentile value, constant, type Double, range `[0.0, 1.0]`, e.g., `0.99` means 99th percentile. Must be a constant. |
| `<compression>` | Optional, compression level, type Double, range `[2048, 10000]`. Higher values increase precision but consume more memory. If not specified or out of range, defaults to `10000`. |

## Return Value

Returns the approximate percentile of the specified column, type Double.
If there is no valid data in the group, returns NULL.

## Examples

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);
```

```sql
-- Calculate 99th percentile using different compression levels
SELECT 
    percentile_approx(response_time, 0.99) as p99_default,          -- Default compression
    percentile_approx(response_time, 0.99, 2048) as p99_fast,       -- Lower compression, faster
    percentile_approx(response_time, 0.99, 10000) as p99_accurate   -- Higher compression, more accurate
FROM response_times;
```

```text
+-------------------+-------------------+-------------------+
| p99_default       | p99_fast          | p99_accurate      |
+-------------------+-------------------+-------------------+
| 100.5999984741211 | 100.5999984741211 | 100.5999984741211 |
+-------------------+-------------------+-------------------+
```

```sql
SELECT percentile_approx(if(response_time>90,response_time,NULL), 0.5) FROM response_times;
```

Only non-NULL data is calculated.

```text
+-----------------------------------------------------------------+
| percentile_approx(if(response_time>90,response_time,NULL), 0.5) |
+-----------------------------------------------------------------+
|                                               100.5999984741211 |
+-----------------------------------------------------------------+
```

```sql
SELECT percentile_approx(NULL, 0.99) FROM response_times;
```

Returns NULL when all input data is NULL.

```text
+-------------------------------+
| percentile_approx(NULL, 0.99)  |
+-------------------------------+
|                          NULL  |
+-------------------------------+
```


