---
{
  "title": "DAYS_ADD",
  "description": "指定された時間間隔を日付に追加します。",
  "language": "ja"
}
---
## 説明

日付に指定された時間間隔を追加します。

## エイリアス

- date_add
- days_add
- adddate

## 構文

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<date>` | 有効な日付値 |
| `<expr>` | 追加したい時間間隔 |
| `<time_unit>` | 列挙値: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

計算された日付を返します。

## Examples

```sql
select date_add('2010-11-30 23:59:59', INTERVAL 2 DAY);
```
```text
+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+
```
