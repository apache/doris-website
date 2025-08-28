---
{
    "title": "PERCENTILE_ARRAY",
    "language": "en"
}
---

## Description

The `PERCENTILE_ARRAY` function calculates exact percentile arrays, allowing multiple percentile values to be computed at once. This function is primarily suitable for small datasets.

Key features:
1. Exact Calculation: Provides exact percentile results rather than approximations
2. Batch Processing: Can calculate multiple percentiles in a single operation
3. Scope: Best suited for handling small-scale datasets


## Syntax

```sql
PERCENTILE_ARRAY(<col>, <array_p>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to calculate the exact percentiles for. Supported types: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |
| `<array_p>` | Percentile array, each element must be a constant of type Array<Double>, with values in the range `[0.0, 1.0]`, e.g., `[0.5, 0.95, 0.99]`. |

## Return Value

Returns a DOUBLE type array containing the calculated percentile values.
If there is no valid data in the group, returns an empty array.


## Examples

```sql
-- setup
CREATE TABLE sales_data (
    id INT,
    amount DECIMAL(10, 2)
) DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO sales_data VALUES
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
SELECT percentile_array(amount, [0.25, 0.5, 0.75, 0.9]) as percentiles
FROM sales_data;
```

Calculate multiple percentiles.

```text
+-----------------------------------------------------+
| percentiles                                         |
+-----------------------------------------------------+
| [21.525000000000002, 33, 44.475, 55.41999999999998] |
+-----------------------------------------------------+
```

```sql
SELECT percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) FROM sales_data;
```

Only non-NULL data is calculated.

```text
+------------------------------------------------------------+
| percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) |
+------------------------------------------------------------+
| [100.6, 100.6]                                             |
+------------------------------------------------------------+
```

```sql
SELECT percentile_array(NULL, [0.5, 0.99]) FROM sales_data;
```

Returns an empty array when all input data is NULL.

```text
+-------------------------------------+
| percentile_array(NULL, [0.5, 0.99]) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
