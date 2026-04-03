---
{
  "title": "TIMEDIFF",
  "description": "TIMEDIFF関数は2つのdatetime値の差を計算し、結果をTIME型として返します。",
  "language": "ja"
}
---
## 説明

TIMEDIFF関数は2つのdatetime値の差を計算し、結果をTIME型として返します。この関数はDATETIME型とDATE型の処理をサポートしています。入力がDATE型の場合、その時刻部分はデフォルトで00:00:00となります。

この関数はMySQLの[timediff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff)と一貫した動作をします。

## 構文

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```
## パラメータ

| Parameter              | デスクリプション                                                                                                                                                                                                                                                              |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr1>` | 終了時刻またはdatetime値。date/datetimeタイプの入力をサポートします。具体的なdatetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<date_or_time_expr2>` | 開始時刻またはdatetime値。date/datetimeタイプの入力をサポートします                                                                                                                                                                                                  |

## Return Value

2つの入力間の時間差を表す`TIME`タイプの値を返します：
- `<end_datetime>`が`<start_datetime>`より後の場合、正の時間差を返します
- `<end_datetime>`が`<start_datetime>`より前の場合、負の時間差を返します
- `<end_datetime>`と`<start_datetime>`が等しい場合、`00:00:00`を返します
- `<end_datetime>`または`<start_datetime>`が`NULL`の場合、関数は`NULL`を返します
- 返される時間差が整数秒でない場合、返される時間にはスケールがあります
- 計算結果が時間範囲[-838:59:59, 838:59:59]を超える場合、エラーを返します

## Examples

```sql
-- Difference between two DATETIMEs (spanning days)
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- Difference between datetime and date (date defaults to 00:00:00)
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- End time earlier than start time (returns negative value)
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- Time difference within the same date
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- Difference across years
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- When returned time is not an integer number of seconds, returns time with scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+-----------+
| result    |
+-----------+
| 00:00:06  |
+-----------+

-- Calculation result exceeds time size range, returns error
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- Any parameter is NULL (returns NULL)
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```
