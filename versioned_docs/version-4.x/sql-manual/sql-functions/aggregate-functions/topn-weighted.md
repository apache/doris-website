---
{
    "title": "TOPN_WEIGHTED",
    "language": "en",
    "description": "The TOPNWEIGHTED function returns the N most frequent values in the specified column with weighted counting. Unlike the regular TOPN function,"
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
| `<expr>` | The column or expression to be counted. Supported types: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, String. |
| `<weight>` | The column or expression used to adjust the weight. Supported type: Double.|
| `<top_num>` | The number of most frequent values to return. Must be a positive integer. Supported type: Integer. |
| `<space_expand_rate>` | Optional. Sets the number of counters used in the Space-Saving algorithm: `counter_numbers = top_num * space_expand_rate`. The larger the value, the more accurate the result. Default is 50. Supported type: Integer. |

## Return Value

Returns an array containing the N values with the highest weighted counts.
If there is no valid data in the group, returns NULL.

## Example
```sql
-- setup
CREATE TABLE product_sales (
    product_id INT,
    sale_amount DECIMAL(10,2),
    sale_date DATE
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO product_sales VALUES
(1, 100.00, '2024-01-01'),
(2, 50.00, '2024-01-01'),
(1, 150.00, '2024-01-01'),
(3, 75.00, '2024-01-01'),
(1, 200.00, '2024-01-01'),
(2, 80.00, '2024-01-01'),
(1, 120.00, '2024-01-01'),
(4, 90.00, '2024-01-01');
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales;
```

Find the top 3 products by sales amount (weighted).

```text
+--------------+
| top_products |
+--------------+
| [1, 2, 4]    |
+--------------+
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales where product_id is null;
```

Find the top 3 products by sales amount (weighted).

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```
