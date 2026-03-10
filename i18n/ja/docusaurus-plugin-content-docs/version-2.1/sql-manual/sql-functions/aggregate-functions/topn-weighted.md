---
{
  "title": "TOPN_WEIGHTED",
  "language": "ja",
  "description": "TOPNWEIGHTED関数は、重み付きカウントを使用して、指定された列で最も出現頻度の高いN個の値を返します。通常のTOPN関数とは異なり、"
}
---
## 説明

TOPN_WEIGHTED関数は、重み付きカウントを使用して、指定された列のN個の最頻値を返します。通常のTOPN関数とは異なり、TOPN_WEIGHTEDは重みを通じて値の重要度を調整することができます。

## 構文

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<expr>` | カウントする列または式 |
| `<weight>` | 重みを調整する列または式 |
| `<top_num>` | 返す最も頻度の高い値の数。正の整数である必要があります。 |
| `<space_expand_rate>` | オプション、Space-Savingアルゴリズムで使用されるcounter_numbersを設定する値。`counter_numbers = top_num * space_expand_rate`。space_expand_rateの値は1より大きい必要があり、デフォルト値は50です。 |

## Return Value

値と重み付きカウントを含む配列を返します。

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
