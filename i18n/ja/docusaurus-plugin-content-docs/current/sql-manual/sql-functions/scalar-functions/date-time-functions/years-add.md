---
{
  "title": "YEARS_ADD",
  "language": "ja",
  "description": "YEARSADD関数は、指定された日付または時刻値に指定された年数を加算（または減算）するために使用され、調整された日付または時刻を返します。"
}
---
## 説明

YEARS_ADD関数は、指定した年数を日付または時刻値に加算（または減算）し、調整された日付または時刻を返すために使用されます。DATEおよびDATETIME型の処理をサポートし、年数は正の値（加算）または負の値（減算）を指定できます。この関数はDATE、DATETIMEおよびTIMESTAMPTZ入力型をサポートします。

この関数は、MySQLでYEARを単位として使用する[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一致します。

## 構文

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力datetime値、date/datetime/timestamptz型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<years>` | 追加する年数、INT型、負の数は減算を示し、正の数は加算を示します |


## 戻り値

入力型（DATE、DATETIME、またはTIMESTAMPTZ）と一致する結果を返し、調整された日付または時刻を表します。戻り値の型は最初のパラメータの型によって決まります：

- 入力がDATE型の場合、戻り値はDATE型です（年、月、日のみ調整）。
- 入力がDATETIME型の場合、戻り値はDATETIME型です（年、月、日が調整され、時、分、秒は変更されません）。
- 入力がTIMESTAMPTZ型の場合、戻り値はTIMESTAMPTZ型です（日付、時刻、タイムゾーンオフセットを含む）。
- `<years_value>`が負の数の場合、年を減算することを示します（YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`)と同等）。
- 入力パラメータがNULLの場合、NULLを返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返します。
- 調整された月の日数が不足している場合（例：2月29日に1年を加算し、翌年がうるう年でない場合）、その月の最終日に自動的に調整されます（例：2020-02-29に1年を加算すると2021-02-28を返します）。

## 例

```sql
-- DATETIME type add 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_ADD('2020-01-31 02:02:02', 1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2021-01-31 02:02:02   |
+-----------------------+

-- DATETIME type subtract 1 year (negative years_value, cross-year)
SELECT YEARS_ADD('2023-05-10 15:40:20', -1) AS subtract_1_year_datetime;
+--------------------------+
| subtract_1_year_datetime |
+--------------------------+
| 2022-05-10 15:40:20      |
+--------------------------+

-- DATE type add 3 years (only adjust date)
SELECT YEARS_ADD('2019-12-25', 3) AS add_3_year_date;
+------------------+
| add_3_year_date  |
+------------------+
| 2022-12-25       |
+------------------+

-- Leap day handling (2020-02-29 add 1 year, next year is not leap year)
SELECT YEARS_ADD('2020-02-29', 1) AS leap_day_adjust;
+------------------+
| leap_day_adjust  |
+------------------+
| 2021-02-28       |
+------------------+

-- Cross-month day adjustment (January 31st add 1 year to February)
SELECT YEARS_ADD('2023-01-31', 1) AS month_day_adjust;
+------------------+
| month_day_adjust |
+------------------+
| 2024-01-31       |  -- 2024 January has 31 days, no adjustment needed
+------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2026-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_ADD('9999-12-31', 1);
-- ERROR: Operation out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_ADD('0000-01-01', -1);
-- ERROR: Operation out of range
```
