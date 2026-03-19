---
{
  "title": "WEEKDAY",
  "description": "WEEKDAY関数は日付の曜日インデックス値を返します。月曜日が0、火曜日が1、日曜日が6となります。",
  "language": "ja"
}
---
## 説明

WEEKDAY関数は日付の曜日インデックス値を返します。月曜日が0、火曜日が1、日曜日が6となります。

WEEKDAYとDAYOFWEEKの違いに注意してください：

```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```
この関数は、MySQLの[weekday function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekday)と一貫した動作をします。

## Syntax

```sql
WEEKDAY(`<date_or_time_expr>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<datetime_or_date>` | 入力datetime値、date/datetimeタイプをサポートします。datetimeおよびdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## 戻り値
日付の曜日に対応するインデックスを返します。タイプはINTです。

- 入力がNULLの場合、NULLを返します

## 例

```sql
-- 2023-10-09 is Monday, returns 0
SELECT WEEKDAY('2023-10-09'); 
+-------------------------+
| WEEKDAY('2023-10-09')   |
+-------------------------+
| 0                       |
+-------------------------+

-- 2023-10-15 is Sunday, returns 6
SELECT WEEKDAY('2023-10-15 18:30:00'); 
+----------------------------------+
| WEEKDAY('2023-10-15 18:30:00')   |
+----------------------------------+
| 6                                |
+----------------------------------+

-- Input is NULL, returns NULL
SELECT WEEKDAY(NULL);
+---------------+
| WEEKDAY(NULL) |
+---------------+
|          NULL |
+---------------+
```
