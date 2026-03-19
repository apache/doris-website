---
{
  "title": "TOPN",
  "language": "ja",
  "description": "TOPN関数は、指定された列でN個の最頻値を返します。"
}
---
## 説明

TOPN関数は、指定された列でN個の最も頻繁に出現する値を返します。これは近似計算関数で、カウント数の降順で並べられた結果を返します。

## 構文

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```
## パラメーター
| パラメーター | 説明 |
| -- | -- |
| `<expr>` | カウントする列または式。 |
| `<top_num>` | 返す最頻値の数。正の整数である必要があります。 |
| `<space_expand_rate>` | オプションパラメーター。Space-Savingアルゴリズムで使用するカウンターの数を設定するために使用されます。`counter_numbers = top_num * space_expand_rate`。space_expand_rateの値が大きいほど結果がより正確になり、デフォルト値は50です。 |

## 戻り値

値とそれに対応する出現回数を含むJSON文字列を返します。

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
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits;
```
```text
+---------------------+
| top_pages           |
+---------------------+
| {"1":4,"2":2,"4":1} |
+---------------------+
```
