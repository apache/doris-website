---
{
    "title": "TOPN_WEIGHTED",
    "language": "ja",
    "description": "TOPNWEIGHTED 関数は、指定した列で重み付きの出現回数が多い上位 N 個の値を返します。通常の TOPN 関数とは異なり、"
}
---

## 説明

TOPN_WEIGHTED 関数は、指定した列で重み付きの出現回数が多い上位 N 個の値を返します。通常の TOPN 関数とは異なり、重みによって値の重要度を調整できます。

## 構文

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 集計対象の列または式。対応する型: TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、String。 |
| `<weight>` | 重みの調整に使用する列または式。対応する型: Double。|
| `<top_num>` | 返す値の個数。正の整数を指定する必要があります。対応する型: Integer。 |
| `<space_expand_rate>` | 省略可能。Space-Saving アルゴリズムで使用するカウンターの数を `counter_numbers = top_num * space_expand_rate` として設定します。値が大きいほど結果の精度が高くなります。デフォルトは 50 です。対応する型: Integer。 |

## 戻り値

重み付きの出現回数が多い上位 N 個の値を含む配列を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例
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

売上金額を重みとして、上位 3 件の商品を取得します。

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

売上金額を重みとして、上位 3 件の商品を取得します。

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```
