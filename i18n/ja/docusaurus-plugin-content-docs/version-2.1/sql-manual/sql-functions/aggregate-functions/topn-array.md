---
{
  "title": "TOPN_ARRAY",
  "language": "ja",
  "description": "TOPNARRAYは、指定された列のN個の最頻値の配列を返します。"
}
---
## 説明

TOPN_ARRAYは、指定された列のN個の最頻値の配列を返します。これは近似計算関数で、カウントの降順で並べられた結果を返します。

## 構文

```sql
TOPN_ARRAY(<expr>, <top_num> [, <space_expand_rate>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | カウントする列または式。 |
| `<top_num>` | 返す最頻値の数。正の整数である必要があります。 |
| `<space_expand_rate>` | オプションパラメータ。Space-Savingアルゴリズムで使用するカウンタ数の設定に使用されます。`counter_numbers = top_num * space_expand_rate`、space_expand_rateの値が大きいほど結果がより正確になり、デフォルト値は50です。 |

## 戻り値

最頻値上位N個を含む配列を返します。

## 例

```sql
-- Create sample table
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');

-- Find top 3 most visited pages
SELECT TOPN_ARRAY(page_id, 3) as top_pages
FROM page_visits;
```
```text
+-----------+
| top_pages |
+-----------+
| [1, 2, 4] |
+-----------+
```
