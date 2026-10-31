---
{
    "title": "TOPN_ARRAY",
    "language": "ja",
    "description": "TOPNARRAY は、指定した列で出現頻度が最も高い N 個の値の配列を返します。"
}
---

## 説明 {#description}

TOPN_ARRAY は、指定した列で出現頻度が最も高い N 個の値の配列を返します。件数の降順で結果を返す近似計算関数です。

## 構文 {#syntax}

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | カウント対象の列または式。サポートされる型: Boolean（Doris 4.1 系列では 4.1.5 以降）、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、String。 |
| `<top_num>` | 返す出現頻度が最も高い値の数。正の INT 定数である必要があります。 |
| `<space_expand_rate>` | オプションの INT 定数で、デフォルト値は 50 です。正の値を指定すると、中間状態のシリアライズ時に最大 `top_num * space_expand_rate` 個の候補を保持します。値が大きいほど、通常は精度が向上します。これはローカル集約メモリのハード上限ではありません。Doris 4.1 系列では 4.1.5 以降、0 以下の値を指定するとすべての中間候補を保持しますが、最終結果に含まれる値は `top_num` 個以下です。このモードではより多くのメモリを使用する可能性があり、クエリのメモリ制限が適用されます。 |

## 戻り値 {#return-value}

出現頻度が最も高い N 個の値を含む配列を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例 {#example}
```sql
-- setup
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');
```

```sql
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```

訪問数が最も多い上位 3 ページを検索します。

```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```

```sql
SELECT TOPN_ARRAY(page_id, 3) as top_pages FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```

BOOLEAN 入力（Doris 4.1 系列では 4.1.5 以降）:

```sql
SELECT TOPN_ARRAY(TRUE, 2), TOPN_ARRAY(CAST(NULL AS BOOLEAN), 2);
```

```text
[1]    NULL
```
