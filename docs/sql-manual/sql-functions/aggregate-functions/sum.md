---
{
    "title": "SUM",
    "language": "en",
    "description": "Used to return the sum of all values of the selected field"
}
---

## Description

Used to return the sum of all values of the selected field

## Syntax

```sql
SUM(<expr>)
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<expr>` | The field to calculate the sum of, supports type Double, Float, Decimal, LargeInt, BigInt, Integer, SmallInt, TinyInt. |

## Return Value

Return the sum of all values of the selected field.
If there is no valid data in the group, returns NULL.

## Examples
```sql
-- Create sample tables
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO sales_table VALUES
(1, 99.99, 2),
(2, 159.99, 1),
(3, 49.99, 5),
(4, 299.99, 1),
(5, 79.99, 3);

-- Calculate the total sales amount
SELECT SUM(price * quantity) as total_sales
FROM sales_table;
```

```text
+-------------+
| total_sales |
+-------------+
|     1149.88 |
+-------------+
```
