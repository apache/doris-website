---
{
  "title": "TOPN_WEIGHTED",
  "description": "TOPNWEIGHTED関数は、重み付きカウントを使用して、指定された列内で最も頻度の高いN個の値を返します。通常のTOPN関数とは異なり、",
  "language": "ja"
}
---
## 説明

TOPN_WEIGHTED関数は、重み付けカウントを使用して、指定された列で最も頻度の高いN個の値を返します。通常のTOPN関数とは異なり、TOPN_WEIGHTEDでは重みを通じて値の重要度を調整することができます。

## 構文

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | カウント対象となるカラムまたは式。サポートされる型: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, IPV4, IPV6, String。 |
| `<weight>` | 重みを調整するために使用されるカラムまたは式。サポートされる型: Double。|
| `<top_num>` | 返す最頻値の数。正の整数である必要があります。サポートされる型: Integer。 |
| `<space_expand_rate>` | オプション。Space-Savingアルゴリズムで使用されるカウンタ数を設定します: `counter_numbers = top_num * space_expand_rate`。値が大きいほど、結果がより正確になります。デフォルトは50。サポートされる型: Integer。 |

## Return Value

重み付きカウントが最も高いN個の値を含む配列を返します。
グループ内に有効なデータがない場合、NULLを返します。

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
売上金額（重み付き）による上位3つの商品を検索する。

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
売上金額（重み付き）の上位3つの商品を見つけます。

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```
