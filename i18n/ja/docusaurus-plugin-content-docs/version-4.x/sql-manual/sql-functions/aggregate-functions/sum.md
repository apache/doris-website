---
{
    "title": "SUM",
    "language": "ja",
    "description": "指定したフィールドのすべての値の合計を返します。"
}
---

## 説明

指定したフィールドのすべての値の合計を返します。

## 構文

```sql
SUM(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<expr>` | 合計を計算するフィールド。Double、Float、Decimal、LargeInt、BigInt、Integer、SmallInt、TinyInt 型をサポートします。 |

## 戻り値

指定したフィールドのすべての値の合計を返します。
グループ内に有効なデータがない場合は、NULL を返します。

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
