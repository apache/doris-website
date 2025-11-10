---
{
    "title": "PERCENTILE_RESERVOIR",
    "language": "en"
}
---

## Description

This function applies [reservoir sampling](https://en.wikipedia.org/wiki/Reservoir_sampling) with a reservoir size up to 8192 and a random number generator for sampling. This used to calculate approximate percentiles at position `p`.
The value of `p` is between `0` and `1`.
Note that this is not the average of the two numbers.

## Syntax

```sql
PERCENTILE_RESERVOIR(<col>, <p>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to be calculated as the approximate percentile, Supported types: Double |
| `<p>` | The approximate percentile to be calculated, a constant value, Supported types: Double with a value range of `[0.0, 1.0]`. |

## Return Value

Return the approximate percentile of the specified column, with a return type of `DOUBLE`.
- Returns `NULL` when the input column is `NULL`

## Examples

```sql
-- Create sample table
CREATE TABLE sales_data
(
    product_id INT,
    sale_price DECIMAL(10, 2)
) DUPLICATE KEY(`product_id`)
DISTRIBUTED BY HASH(`product_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
INSERT INTO sales_data VALUES
(1, 10.00),
(1, 15.00),
(1, 20.00),
(1, 25.00),
(1, 30.00),
(1, 35.00),
(1, 40.00),
(1, 45.00),
(1, 50.00),
(1, 100.00);

-- Calculate different percentiles of sales prices
SELECT 
    percentile_reservoir(sale_price, 0.5)  as median_price,     -- Median
    percentile_reservoir(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile_reservoir(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile_reservoir(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile_reservoir(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```

```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```

```sql
select percentile(sale_price, NULL) from sales_data;
```

If all input values are NULL, returns NULL.

```text
+------------------------------+
| percentile(sale_price, NULL) |
+------------------------------+
|                         NULL |
+------------------------------+
```