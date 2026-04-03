---
{
  "title": "DAYOFWEEK",
  "language": "ja",
  "description": "DAYOFWEEK関数は、日曜日を1とするルールに従って、日付または時刻式に対応する曜日インデックス値を返すために使用されます。"
}
---
## 説明

DAYOFWEEK関数は、日付または時刻式に対応する曜日インデックス値を返すために使用され、日曜日が1、月曜日が2、...、土曜日が7というルールに従います。

この関数は、MySQLの[dayofweek function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek)と一貫した動作をします

## エイリアス

- DOW

## 構文

```sql
DAYOFWEEK(<date_or_time_expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | date/datetimeタイプをサポートする有効な日付式。特定のdatetimeと日付フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値

日付に対応する曜日のインデックス値を表す整数を返します（1-7、1は日曜日、7は土曜日を表します）。

特別なケース：

`<date_or_time_expr>`がNULLの場合、NULLを返します；

## 例

```sql
---Calculate weekday index value for date type
select dayofweek('2019-06-25');

+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---Calculate weekday index value for datetime type
select dayofweek('2019-06-25 15:30:45');

+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+
---Index for Sunday
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---Input datetime is NULL, returns NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
