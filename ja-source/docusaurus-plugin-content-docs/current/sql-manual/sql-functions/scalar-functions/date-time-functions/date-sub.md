---
{
  "title": "DATE_SUB",
  "language": "ja",
  "description": "DATESUB関数は、指定された日付または時刻値から指定された時間間隔を減算し、計算された日付または時刻の結果を返すために使用されます。"
}
---
## 説明

DATE_SUB関数は、指定された日付または時刻値から指定された時間間隔を減算し、計算された日付または時刻の結果を返すために使用されます。この関数は、DATE（日付のみ）、DATETIME（日付と時刻）、およびTIMESTAMPTZ（日付、時刻、およびタイムゾーンオフセット）型の操作をサポートしており、時間間隔は数値と単位の両方によって定義されます。

この関数は、MySQLの[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と一貫した動作をします。

## エイリアス

- days_sub
- subdate

## 構文

```sql
DATE_SUB(<date_or_time_part>, INTERVAL <expr> <time_unit>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | 有効な日付値で、datetimeまたはdate型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<expr>` | 減算する時間間隔。独立した単位（`YEAR`など）は`INT`型です。複合単位（`YEAR_MONTH`など）は`STRING`型で、すべての非数値文字を区切り文字として受け入れます。そのため、例えば`INTERVAL 6/4 HOUR_MINUTE`は、Dorisによって1時間30分（6/4 == 1.5）ではなく6時間4分として認識されます。複合単位の場合、入力された間隔値が短すぎる場合、より大きな単位の値は0に設定されます。この値の符号は、最初の非数値文字が`-`であるかどうかのみによって決定されます。 |
| `<time_unit>` | 列挙値：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND、YEAR_MONTH、DAY_HOUR、DAY_MINUTE、DAY_SECOND、DAY_MICROSECOND、HOUR_MINUTE、HOUR_SECOND、HOUR_MICROSECOND、MINUTE_SECOND、MINUTE_MICROSECOND、SECOND_MICROSECOND |

| time_unit          | 期待される形式（すべての非数値文字を区切り文字として受け入れる） |
| ------------------ | ----------------------------------------- |
| YEAR               | 'YEARS'                                   |
| QUARTER            | 'QUARTERS'                                |
| MONTH              | 'MONTHS'                                  |
| WEEK               | 'WEEKS'                                   |
| DAY                | 'DAYS'                                    |
| HOUR               | 'HOURS'                                   |
| MINUTE             | 'MINUTES'                                 |
| SECOND             | 'SECONDS'                                 |
| MICROSECOND        | 'MICROSECONDS'                            |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 戻り値

dateと同じ型の計算結果を返します：
- 入力がDATEの場合、DATE（日付部分のみ）を返します
- 入力がDATETIMEの場合、DATETIME（日付と時刻を含む）を返します
- 入力がTIMESTAMPTZの場合、TIMESTAMPTZ（日付、時刻、タイムゾーンオフセットを含む）を返します
- scaleを持つdatetime型の場合、scaleは保持されて返されます

特殊なケース：
- いずれかのパラメータがNULLの場合、NULLを返します
- 不正なexpr（負の値）またはtime_unitの場合、NULLを返します
- 複合単位の場合、入力部分が過大であるか、いずれかの部分が許可される最大値922337203685477579を超える場合、エラーを返します
- 計算結果が日付型でサポートされる最小値（例：'0000-01-01'より前）より早い場合、エラーを返します

## Examples

```sql
-- Subtract two days
mysql> select date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-11-28 23:59:59                                               |
+-------------------------------------------------------------------+

-- Parameter with scale, return preserves scale
mysql> select date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND);
+------------------------------------------------------+
| date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND) |
+------------------------------------------------------+
| 2010-11-30 23:59:55.6                                |
+------------------------------------------------------+

-- Subtract two months across years
mysql> select date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH);
+--------------------------------------------------------+
| date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH) |
+--------------------------------------------------------+
| 2022-11-15                                             |
+--------------------------------------------------------+

-- February 2023 has only 28 days, so subtracting one month from 2023-03-31 results in 2023-02-28
mysql> select date_sub('2023-03-31', INTERVAL 1 MONTH);
+------------------------------------------+
| date_sub('2023-03-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Subtract 61 seconds
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND);
+-----------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND) |
+-----------------------------------------------------+
| 2023-12-31 23:58:58                                 |
+-----------------------------------------------------+

-- Subtract quarters
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER);
+------------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER) |
+------------------------------------------------------+
| 2008-09-30 23:59:59                                  |
+------------------------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY);
+-----------------------------------------------------------+
| DATE_SUB('2024-02-05 02:03:04.123+12:00', INTERVAL 1 DAY) |
+-----------------------------------------------------------+
| 2024-02-03 22:03:04.123+08:00                             |
+-----------------------------------------------------------+

-- Any parameter is NULL
mysql> select date_sub('2023-01-01', INTERVAL NULL DAY);
+-------------------------------------------+
| date_sub('2023-01-01', INTERVAL NULL DAY) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+


-- For compound units, accept all non-numeric characters as separators.
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_SUB('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-22 08:10:10                                            |
+----------------------------------------------------------------+

-- For composite units, the sign of the time interval is determined only by whether the first non-digit character is `-`
-- All subsequent `-` are considered part of the delimiter
select 
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
    DATE_SUB('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:09:09 | 2025-10-23 10:11:11 |
+---------------------+---------------------+

-- For composite units, if the input time interval is too short, the value of the larger unit will be set to 0.
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:09     |
+-------------------------+

-- If the number of time intervals input is excessive, return an error
select DATE_SUB('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of -1:2:3.4 is invalid

-- For composite units, if the value of any part exceeds the maximum value of 922337203685477580
-- return an error
select DATE_SUB('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, -922337203685477580 out of range


-- Exceeds minimum date
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_add of 0000-01-01, -1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-01-01, 1 out of range
```
```
