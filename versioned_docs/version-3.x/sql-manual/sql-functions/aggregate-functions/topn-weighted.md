---
{
    "title": "TOPN_WEIGHTED",
    "language": "en"
}
---

## Description

The TOPN_WEIGHTED function returns the N most frequent values in the specified column with weighted counting. Unlike the regular TOPN function, TOPN_WEIGHTED allows adjusting the importance of values through weights.

## Syntax

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The column or expression to be counted |
| `<weight>` | The column or expression to adjust the weight |
| `<top_num>` | The number of the most frequent values to return. It must be a positive integer. |
| `<space_expand_rate>` | Optional, the value to set the counter_numbers used in the Space-Saving algorithm. `counter_numbers = top_num * space_expand_rate`. The value of space_expand_rate should be greater than 1, and the default value is 50. |

## Return Value

Return an array containing values and weighted counts.

## Examples
```sql
-- create example table
CREATE TABLE product_sales (
    product_id INT,
    sale_amount DECIMAL(10,2),
    sale_date DATE
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- insert test data
INSERT INTO product_sales VALUES
(1, 100.00, '2024-01-01'),
(2, 50.00, '2024-01-01'),
(1, 150.00, '2024-01-01'),
(3, 75.00, '2024-01-01'),
(1, 200.00, '2024-01-01'),
(2, 80.00, '2024-01-01'),
(1, 120.00, '2024-01-01'),
(4, 90.00, '2024-01-01');

-- find the top 3 products with highest sales amount
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales;
```

```text
+--------------+
| top_products |
+--------------+
| [1, 2, 4]    |
+--------------+
```
