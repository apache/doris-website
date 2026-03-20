---
{
  "title": "YEARS_ADD",
  "description": "YEARSADD関数は、指定された日付または時刻の値に対して指定された年数を加算（または減算）するために使用され、調整された日付または時刻を返します。",
  "language": "ja"
}
---
## 説明

YEARS_ADD関数は、指定された日付または時刻値に対して指定した年数を加算（または減算）し、調整された日付または時刻を返すために使用されます。DATEおよびDATETIME型の処理をサポートし、年数は正の値（加算）または負の値（減算）を指定できます。

この関数は、MySQLでYEARを単位として使用する[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一致しています。

## 構文

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<date_or_time_expr>` | 入力するdatetime値、date/datetimeタイプをサポートします。datetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<years>` | 追加する年数、タイプはINT、負数は減算を示し、正数は加算を示します |


## Return Value

入力タイプ（DATEまたはDATETIME）と一致する結果を返し、調整された日付または時刻を表します：

- 入力がDATEタイプの場合、戻り値はDATEタイプのままです（年、月、日のみを調整）。
- 入力がDATETIMEタイプの場合、戻り値はDATETIMEタイプのままです（年、月、日を調整し、時、分、秒は変更されません）。
- `<years_value>`が負数の場合、年数を減算することを示します（YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`)と同等）。
- 任意の入力パラメータがNULLの場合、NULLを返します。
- 計算結果が有効な日付タイプの範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超えた場合、エラーを返します。
- 調整された月に十分な日数がない場合（例：2月29日に1年を加算し、翌年がうるう年でない場合）、その月の最後の日に自動的に調整されます（例：2020-02-29に1年を加算すると2021-02-28を返します）。

## Examples

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

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_ADD('9999-12-31', 1);
-- ERROR: Operation out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_ADD('0000-01-01', -1);
-- ERROR: Operation out of range
```
