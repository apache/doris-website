---
{
    "title": "TOPN_ARRAY",
    "language": "ja",
    "description": "TOPN_ARRAY は、指定した列で出現頻度が高い上位 N 個の値を配列で返します。"
}
---

## 説明 {#description}

TOPN_ARRAY は、指定した列で出現頻度が高い上位 N 個の値を配列で返します。近似計算を行う関数で、出現回数の降順に並べた結果を返します。

## 構文 {#syntax}

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 集計対象の列または式。対応する型: Boolean（Doris 4.1 シリーズでは 4.1.5 以降）、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、Timestamptz、IPV4、IPV6、UUID、String。 |
| `<top_num>` | 返す出現頻度上位の値の数。正の INT 定数を指定する必要があります。 |
| `<space_expand_rate>` | 省略可能な INT 定数。デフォルトは 50 です。正の値を指定すると、中間状態のシリアライズ時に保持する候補は最大 `top_num * space_expand_rate` 件になります。一般に、値を大きくすると精度が向上します。これはローカル集約で使用するメモリの厳密な上限ではありません。Doris 4.1 シリーズの 4.1.5 以降では、0 以下を指定すると中間候補をすべて保持しますが、最終結果に含まれる値は最大 `top_num` 個です。このモードではメモリ使用量が増える可能性があり、クエリのメモリ制限は引き続き適用されます。 |

## 戻り値 {#return-value}

出現頻度が高い上位 N 個の値を含む配列を返します。
グループ内に有効なデータがない場合は、NULL を返します。

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

訪問回数が多い上位 3 ページを求めます。

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

BOOLEAN 入力（Doris 4.1 シリーズの 4.1.5 以降）:

```sql
SELECT TOPN_ARRAY(TRUE, 2), TOPN_ARRAY(CAST(NULL AS BOOLEAN), 2);
```

```text
[1]    NULL
```
