---
{
    "title": "DATE_SUB",
    "language": "ja",
    "description": "DATESUB 関数は、指定した日付または時刻の値から指定した時間間隔を減算し、計算後の日付または時刻を返します。"
}
---

## 説明

DATE_SUB 関数は、指定した日付または時刻の値から指定した時間間隔を減算し、計算後の日付または時刻を返します。DATE（日付のみ）、DATETIME（日付と時刻）、TIMESTAMPTZ（日付、時刻、タイムゾーンオフセット）型に対応します。時間間隔は数値と単位で指定します。

この関数の動作は、MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) と一致します。

## 別名

- days_sub
- subdate

## 構文

```sql
DATE_SUB(<date_or_time_part>, INTERVAL <expr> <time_unit>)
```

## パラメーター

| パラメーター | 説明 |
| -- | -- |
| `<date_or_time_part>` | 有効な日付値。DATETIME 型または DATE 型を指定できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<expr>` | 減算する時間間隔。`YEAR` などの単一単位では `INT` 型、`YEAR_MONTH` などの複合単位では `STRING` 型です。複合単位では、数字以外のすべての文字を区切り文字として受け付けます。たとえば、`INTERVAL 6/4 HOUR_MINUTE` は Doris では 6 時間 4 分と解釈され、1 時間 30 分（6/4 == 1.5）とは解釈されません。複合単位で入力した時間間隔の値が短すぎる場合、より大きい単位の値は 0 に設定されます。値の符号は、数字以外で最初に現れる文字が `-` かどうかのみで決まります。 |
| `<time_unit>` | 列挙値：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND、YEAR_MONTH、DAY_HOUR、DAY_MINUTE、DAY_SECOND、DAY_MICROSECOND、HOUR_MINUTE、HOUR_SECOND、HOUR_MICROSECOND、MINUTE_SECOND、MINUTE_MICROSECOND、SECOND_MICROSECOND |

| time_unit          | 想定される形式（数字以外のすべての文字を区切り文字として受け付けます） |
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

計算結果を入力した日付値と同じ型で返します。
- 入力が DATE の場合、DATE（日付部分のみ）を返します。
- 入力が DATETIME の場合、DATETIME（日付と時刻を含む）を返します。
- 入力が TIMESTAMPTZ の場合、TIMESTAMPTZ（日付、時刻、タイムゾーンオフセットを含む）を返します。
- 小数秒の精度を持つ日時型では、その精度を保持して返します。

特殊なケース：
- いずれかのパラメーターが NULL の場合は NULL を返します。
- expr が不正な場合（負の値）、または time_unit が不正な場合は NULL を返します。
- 複合単位で入力した値の部分が多すぎる場合、またはいずれかの部分が許容される最大値 922337203685477579 を超える場合はエラーを返します。
- 計算結果が日付型でサポートされる最小値より前になる場合（たとえば、'0000-01-01' より前）はエラーを返します。

## 例

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
