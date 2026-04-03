---
{
  "title": "TO_DAYS",
  "language": "ja",
  "description": "日付を日数を表す数値に変換する日付計算関数"
}
---
## 説明
日付を日数を表す数値に変換する日付計算関数で、基準日（`0000-00-00`）から指定された日付までの総日数を計算します。

この関数はMySQLの[to_days function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days)と一貫した動作をします。

## 構文

```sql
TO_DAYS(`<date_or_date_expr>`)
```
## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力datetime値、date/datetimeタイプをサポート。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

日数を表すBIGINTタイプを返します。

## 例

```sql
-- Based on the date `0000-00-00`
select to_days('0000-01-01');
+-----------------------+
| to_days('0000-01-01') |
+-----------------------+
|                     1 |
+-----------------------+

--input date type
select to_days('2007-10-07');
+---------------------------------------+
| to_days('2007-10-07') |
+---------------------------------------+
|                                733321 |
+---------------------------------------+

--input datetime type
select to_days('2007-10-07 10:03:09');
+------------------------------------------------+
| to_days('2007-10-07 10:03:09') |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```
