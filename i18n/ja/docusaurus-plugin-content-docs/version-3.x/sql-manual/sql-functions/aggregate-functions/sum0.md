---
{
  "title": "SUM0",
  "description": "選択したフィールドのすべての値の合計を返すために使用されます。SUM関数とは異なり、すべての入力値がNULLの場合、SUM0はNULLではなく0を返します。",
  "language": "ja"
}
---
## 説明

選択されたフィールドのすべての値の合計を返すために使用されます。SUM関数とは異なり、すべての入力値がNULLの場合、SUM0はNULLではなく0を返します。

## 構文

```sql
SUM0(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 合計を計算するフィールド |

## Return Value

選択されたフィールドのすべての値の合計を返します。すべての値がNULLの場合、0を返します。

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
