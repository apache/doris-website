---
{
  "title": "TOPN",
  "description": "TOPN関数は、指定された列内でN個の最も頻度の高い値を返します。",
  "language": "ja"
}
---
## 概要

TOPN関数は、指定された列でN個の最も頻度の高い値を返します。これは近似計算関数であり、カウント数の降順で並べられた結果を返します。

## 構文

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```
## パラメータ
| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | カウント対象の列または式。サポートされる型：TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、String。 |
| `<top_num>` | 返す最頻値の数。正の整数である必要があります。サポートされる型：Integer。 |
| `<space_expand_rate>` | オプション。Space-Savingアルゴリズムで使用されるカウンタ数を設定します：`counter_numbers = top_num * space_expand_rate`。値が大きいほど、結果がより正確になります。デフォルトは50。サポートされる型：Integer。 |

## 戻り値

値とそのカウントを含むJSON文字列を返します。
グループに有効なデータがない場合、NULLを返します。

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
最もアクセス数の多いページの上位3つを見つけます。

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
