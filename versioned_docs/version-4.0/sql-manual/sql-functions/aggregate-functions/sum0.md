---
{
    "title": "SUM0",
    "language": "en"
}
---

## Description

Used to return the sum of all values of the selected field. Unlike the SUM function, when all input values are NULL, SUM0 returns 0 instead of NULL.

## Syntax

```sql
SUM0(<expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | The field to calculate the sum of, supports type Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt. |

## Return Value

Returns the sum of all values of the selected field. If all values are NULL, returns 0.

## Examples

```sql
-- Create example table
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT,
    discount DECIMAL(10,2)
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO sales_table VALUES
(1, 99.99, 2, NULL),
(2, 159.99, 1, NULL),
(3, 49.99, 5, NULL),
(4, 299.99, 1, NULL),
(5, 79.99, 3, NULL);

-- Compare SUM and SUM0
SELECT 
    SUM(discount) as sum_discount,    -- Returns NULL
    SUM0(discount) as sum0_discount   -- Returns 0
FROM sales_table;
```

```text
+--------------+---------------+
| sum_discount | sum0_discount |
+--------------+---------------+
|         NULL |          0.00 |
+--------------+---------------+
```