---
{
    "title": "TOPN",
    "language": "ja",
    "description": "TOPN 関数は、指定した列で出現頻度の高い上位 N 個の値を返します。"
}
---

## 説明

TOPN 関数は、指定した列で出現頻度の高い上位 N 個の値を返します。これは近似計算関数であり、出現回数の降順に並べた結果を返します。

## 構文

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ
| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 出現回数を数える対象の列または式。対応する型: TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、UUID、String。 |
| `<top_num>` | 返す値の個数。正の整数を指定する必要があります。対応する型: Integer。 |
| `<space_expand_rate>` | 省略可能。Space-Saving アルゴリズムで使用するカウンターの数を `counter_numbers = top_num * space_expand_rate` として設定します。値が大きいほど結果の精度が高くなります。デフォルトは 50 です。対応する型: Integer。 |

## 戻り値

値とその出現回数を含む JSON 文字列を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例
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

アクセス回数の多いページを上位 3 件取得します。

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
