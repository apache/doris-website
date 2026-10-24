---
{
    "title": "TOPN",
    "language": "ja",
    "description": "TOPN 関数は、指定したカラムで出現頻度が最も高い N 個の値を返します。"
}
---

## 説明 {#description}

TOPN 関数は、指定したカラムで出現頻度が最も高い N 個の値を返します。これは近似計算関数で、結果を出現回数の降順で返します。

## 構文 {#syntax}

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ {#parameters}
| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 出現回数を集計するカラムまたは式。サポートされる型: TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、UUID、String。 |
| `<top_num>` | 返す値の数。正の INT 定数を指定する必要があります。 |
| `<space_expand_rate>` | 省略可能な INT 定数で、デフォルトは 50 です。正の値を指定すると、中間状態をシリアライズする際に保持する候補は最大 `top_num * space_expand_rate` 個になります。一般に、値を大きくすると精度が向上します。これはローカル集約のメモリ使用量に対する厳密な上限ではありません。Doris 4.1 系列の 4.1.5 以降では、0 以下の値を指定するとすべての中間候補を保持しますが、最終結果に含まれる値は最大 `top_num` 個です。このモードではメモリ使用量が増える場合があり、クエリのメモリ制限も適用されます。 |

## 戻り値 {#return-value}

値とその出現回数を含む JSON 文字列を返します。
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
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits;
```

訪問回数が多い上位 3 ページを求めます。

```text
+---------------------+
| top_pages           |
+---------------------+
| {"1":4,"2":2,"4":1} |
+---------------------+
```

```sql
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```

すべての中間候補を保持し、出現頻度が最も高い値だけを返します。

```sql
SELECT TOPN(s, 1, 0)
FROM (SELECT 'a' AS s UNION ALL SELECT 'b' UNION ALL SELECT 'a') t;
```

```text
{"a":2}
```
