---
{
  "title": "DAYS_SUB",
  "description": "日付から指定された時間間隔を減算します。",
  "language": "ja"
}
---
## デスクリプション

指定された時間間隔を日付から減算します。

## Alias

## 别名

- days_sub
- date_sub
- subdate

## Syntax

```sql
DATE_SUB(<date>, <expr> <time_unit>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<date>` | 有効な日付値 |
| `<expr>`| 減算したい時間間隔 |
| `<type>` | 列挙値: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND |

## Return Value

計算された日付を返します。

## Examples

```sql
select date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY);
```
```text
+-------------------------------------------------+
| date_sub('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-11-28 23:59:59                             |
+-------------------------------------------------+
```
