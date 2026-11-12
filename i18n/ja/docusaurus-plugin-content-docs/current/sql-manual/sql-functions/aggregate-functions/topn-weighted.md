---
{
    "title": "TOPN_WEIGHTED",
    "language": "ja",
    "description": "TOPNWEIGHTED 関数は、指定された列で重み付きカウントによって出現頻度が最も高い N 個の値を返します。通常の TOPN 関数とは異なり、"
}
---

## 説明 {#description}

TOPN_WEIGHTED 関数は、指定された列で重み付きカウントによって出現頻度が最も高い N 個の値を返します。通常の TOPN 関数とは異なり、TOPN_WEIGHTED では重みによって値の重要度を調整できます。

## 構文 {#syntax}

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | カウント対象の列または式。サポートされる型: Boolean（Doris 4.1 系列では 4.1.5 以降）、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、IPV4、IPV6、UUID、String。 |
| `<weight>` | 重みの調整に使用する列または式。型: BIGINT。|
| `<top_num>` | 返す出現頻度の高い値の数。正の INT 定数である必要があります。 |
| `<space_expand_rate>` | 省略可能な INT 定数。デフォルトは 50 です。正の値を指定すると、中間状態のシリアライズ時に最大 `top_num * space_expand_rate` 個の候補を保持します。通常、値を大きくすると精度が向上します。これはローカル集約で使用するメモリの厳密な上限ではありません。Doris 4.1 系列では 4.1.5 以降、0 以下を指定すると中間候補をすべて保持しますが、最終結果に含まれる値は最大 `top_num` 個です。このモードではメモリ使用量が増える可能性があり、クエリのメモリ制限も適用されます。 |

## 戻り値 {#return-value}

重み付きカウントが最も高い N 個の値を含む配列を返します。
グループ内に有効なデータがない場合は、NULL を返します。

## 例 {#example}
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

売上金額で重み付けした上位 3 件の商品を求めます。

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

売上金額で重み付けした上位 3 件の商品を求めます。

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```

BOOLEAN 入力（Doris 4.1 系列では 4.1.5 以降）:

```sql
SELECT TOPN_WEIGHTED(TRUE, 1, 2), TOPN_WEIGHTED(CAST(NULL AS BOOLEAN), 1, 2);
```

```text
[1]    NULL
```
