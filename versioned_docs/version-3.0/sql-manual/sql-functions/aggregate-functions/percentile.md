---
{
    "title": "PERCENTILE",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Calculates the exact percentile, suitable for small datasets. First sorts the specified column in descending order, then takes the exact p-th percentile. The value of `p` is between `0` and `1`. If `p` does not point to an exact position, it returns the [linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation) of the adjacent values at position `p`. Note that this is not the average of the two numbers. Special cases:
- Returns `NULL` when the input column is `NULL`

## Syntax

```sql
PERCENTILE(<col>, <p>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<col>` | The column to be calculated as the exact percentile, which must be an integer column. |
| `<p>` | The exact percentile to be calculated, a constant value, with a value range of `[0.0, 1.0]`. |

## Return Value

Return the exact percentile of the specified column, with a return type of `DOUBLE`.

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
    percentile(sale_price, 0.5)  as median_price,     -- Median
    percentile(sale_price, 0.75) as p75_price,        -- 75th percentile
    percentile(sale_price, 0.90) as p90_price,        -- 90th percentile
    percentile(sale_price, 0.95) as p95_price,        -- 95th percentile
    percentile(null, 0.99)       as p99_null          -- Null value at 99th percentile
FROM sales_data;
```

```text
+--------------+-----------+-------------------+-------------------+----------+
| median_price | p75_price | p90_price         | p95_price         | p99_null |
+--------------+-----------+-------------------+-------------------+----------+
|         32.5 |     43.75 | 54.99999999999998 | 77.49999999999994 |     NULL |
+--------------+-----------+-------------------+-------------------+----------+
```
