---
{
  "title": "合計",
  "language": "ja",
  "description": "選択されたフィールドのすべての値の合計を返すために使用される"
}
---
## 説明

選択したフィールドのすべての値の合計を返すために使用されます

## 構文

```sql
SUM(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<expr>` | 合計を計算するフィールド |

## 戻り値

選択されたフィールドのすべての値の合計を返します。

## 例

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
