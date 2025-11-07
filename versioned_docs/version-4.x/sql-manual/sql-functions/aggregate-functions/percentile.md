---
{
    "title": "PERCENTILE",
    "language": "en"
}
---

## Description

Calculates the exact percentile, suitable for small datasets. First sorts the specified column in descending order, then takes the exact p-th percentile. The value of `p` is between `0` and `1`. If `p` does not point to an exact position, it returns the [linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation) of the adjacent values at position `p`. Note that this is not the average of the two numbers. Special cases:

## Syntax

```sql
PERCENTILE(<col>, <p>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to calculate the exact percentile for. Supported types: Double, Float, LargeInt, BigInt, Int, SmallInt, TinyInt. |
| `<p>` | The exact percentile to be calculated, a constant value. Supported type: Double. Range: `[0.0, 1.0]`. The second parameter must be a constant. |

## Return Value

Return the exact percentile of the specified column, with a return type of Double.
If there is no valid data in the group, returns NULL.

## Examples

```sql
-- Setup
CREATE TABLE sales_data
(
    product_id INT,
    sale_price DECIMAL(10, 2)
) DUPLICATE KEY(`product_id`)
DISTRIBUTED BY HASH(`product_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
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
```

```sql
SELECT 
    percentile(sale_price, 0.5)  as median_price,     -- Median
    percentile(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```

Calculates sale prices at different percentiles.

```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```

```sql
select percentile(if(sale_price>90,sale_price,NULL), 0.5) from sales_data;
```

Only non-NULL input values are considered in the calculation.

```text
+----------------------------------------------------+
| percentile(if(sale_price>90,sale_price,NULL), 0.5) |
+----------------------------------------------------+
|                                                100 |
+----------------------------------------------------+
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
