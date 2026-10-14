---
{
    "title": "SUM0",
    "language": "ja",
    "description": "指定したフィールドのすべての値の合計を返します。SUM 関数とは異なり、入力値がすべて NULL の場合、SUM0 は NULL ではなく 0 を返します。"
}
---

## 説明

指定したフィールドのすべての値の合計を返します。SUM 関数とは異なり、入力値がすべて NULL の場合、SUM0 は NULL ではなく 0 を返します。

## 構文

```sql
SUM0(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 合計を計算するフィールド。Double、Float、Decimal、LargeInt、BigInt、Integer、SmallInt、TinyInt 型をサポートします。 |

## 戻り値

指定したフィールドのすべての値の合計を返します。すべての値が NULL の場合は 0 を返します。

## 例

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
