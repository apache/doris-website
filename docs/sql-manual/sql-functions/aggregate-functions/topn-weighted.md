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
| `<expr>` | The column or expression to be counted. Supported types: Boolean (in the Doris 4.1 series since 4.1.5), TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, IPV4, IPV6, UUID, String. |
| `<weight>` | The column or expression used to adjust the weight. Type: BIGINT.|
| `<top_num>` | The number of most frequent values to return. Must be a positive INT constant. |
| `<space_expand_rate>` | Optional INT constant, default 50. A positive value retains at most `top_num * space_expand_rate` candidates when serializing intermediate state; larger values generally improve accuracy. This is not a hard limit on local aggregation memory. In the Doris 4.1 series since 4.1.5, a value of 0 or less retains all intermediate candidates, while the final result still contains at most `top_num` values. This mode may use more memory and remains subject to query memory limits. |

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

BOOLEAN input (in the Doris 4.1 series since 4.1.5):

```sql
SELECT TOPN_WEIGHTED(TRUE, 1, 2), TOPN_WEIGHTED(CAST(NULL AS BOOLEAN), 1, 2);
```

```text
[1]    NULL
```
