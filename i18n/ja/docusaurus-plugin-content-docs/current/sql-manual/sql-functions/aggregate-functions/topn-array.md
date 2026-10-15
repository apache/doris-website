---
{
    "title": "TOPN_ARRAY",
    "language": "ja",
    "description": "TOPN_ARRAY は、指定した列で出現頻度が高い上位 N 個の値を配列で返します。"
}
---

## 説明

TOPN_ARRAY は、指定した列で出現頻度が高い上位 N 個の値を配列で返します。近似計算を行い、出現回数の多い順に結果を返します。

## 構文

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 出現回数を集計する列または式。サポートされる型: TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、Timestamptz、IPV4、IPV6、UUID、String。 |
| `<top_num>` | 返す頻出値の数。正の整数を指定する必要があります。サポートされる型: Integer。 |
| `<space_expand_rate>` | 省略可能。Space-Saving アルゴリズムで使用するカウンターの数を `counter_numbers = top_num * space_expand_rate` に設定します。値が大きいほど結果の精度が高くなります。デフォルトは 50 です。サポートされる型: Integer。 |

## 戻り値

出現頻度が高い上位 N 個の値を含む配列を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 使用例
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

アクセス数が多い上位 3 件のページを求めます。

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
