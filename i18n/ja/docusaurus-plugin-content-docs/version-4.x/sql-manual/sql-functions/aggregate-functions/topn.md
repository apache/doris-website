---
{
    "title": "TOPN",
    "language": "ja",
    "description": "TOPN 関数は、指定された列で出現頻度が最も高い N 個の値を返します。"
}
---

## 説明 {#description}

TOPN 関数は、指定された列で出現頻度が最も高い N 個の値を返します。これは近似計算関数であり、結果はカウント数の降順で返されます。

## 構文 {#syntax}

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ {#parameters}
| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 集計対象の列または式。サポートされる型：TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、String。 |
| `<top_num>` | 返す出現頻度上位の値の数。正の INT 定数である必要があります。 |
| `<space_expand_rate>` | オプションの INT 定数。デフォルトは 50 です。正の値を指定すると、中間状態をシリアル化する際に最大で `top_num * space_expand_rate` 個の候補を保持します。値を大きくすると、通常は精度が向上します。これはローカル集約メモリのハード上限ではありません。Doris 4.1 系列では 4.1.5 以降、値を 0 以下にすると、すべての中間候補を保持しますが、最終結果に含まれる値は最大で `top_num` 個です。このモードではより多くのメモリを使用する可能性があり、クエリのメモリ制限も受けます。 |

## 戻り値 {#return-value}

値とそのカウントを含む JSON 文字列を返します。
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
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits;
```

アクセス数が最も多い上位 3 ページを検索します。

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

中間候補をすべて保持し、最頻値のみを返します：

```sql
SELECT TOPN(s, 1, 0)
FROM (SELECT 'a' AS s UNION ALL SELECT 'b' UNION ALL SELECT 'a') t;
```

```text
{"a":2}
```
