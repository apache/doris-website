---
{
  "title": "YEARS_SUB",
  "language": "ja",
  "description": "YEARSSUB関数は、指定された日付または時刻値から指定された年数を減算（または加算）するために使用されます。"
}
---
## 説明

YEARS_SUB関数は、指定された日付または時刻値から指定された年数を減算（または加算）するために使用され、調整された日付または時刻を返します（本質的にyears_value × 1年を減算します）。この関数はDATEおよびDATETIME型の処理をサポートし、年数は正の値（減算）または負の値（加算）にすることができます。この関数はDATE、DATETIMEおよびTIMESTAMPTZ入力型をサポートします。

この関数は、MySQLでYEARを単位として使用する[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と一貫した動作をします。

## 構文

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```
## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時値。date/datetime/timestamptz型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<years>` | 減算する年数。INT型。正の数は減算を、負の数は加算を示します |

## 戻り値

入力タイプと一致する結果（DATE または DATETIME または TIMESTAMPTZ）を返し、調整された日付または時刻を表します。戻り値の型は最初のパラメータの型によって決定されます：

- 入力がDATE型の場合、戻り値はDATE型です（年、月、日のみ調整）。
- 入力がDATETIME型の場合、戻り値はDATETIME型です（年、月、日が調整され、時、分、秒は変更されません）。
- 入力がTIMESTAMPTZ型の場合、戻り値はTIMESTAMPTZ型です（日付、時刻、タイムゾーンオフセットを含む）。
- `<years_value>`が負の数の場合は年の加算を示します（YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`)と同等）。
- いずれかの入力パラメータがNULLの場合、NULLを返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返します。
- 調整後の月の日数が不足する場合（例：うるう年の2月29日から1年を減算して平年の2月28日になる場合）、その月の実際の日数に自動調整されます。

## Examples

```sql
-- DATETIME type subtract 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_SUB('2020-02-02 02:02:02', 1) AS sub_1_year_datetime;
+---------------------+
| sub_1_year_datetime |
+---------------------+
| 2019-02-02 02:02:02 |
+---------------------+

-- DATETIME type add 1 year (negative years_value, cross-year)
SELECT YEARS_SUB('2022-05-10 15:40:20', -1) AS add_1_year_datetime;
+---------------------+
| add_1_year_datetime |
+---------------------+
| 2023-05-10 15:40:20 |
+---------------------+

-- DATE type subtract 3 years (only adjust date)
SELECT YEARS_SUB('2022-12-25', 3) AS sub_3_year_date;
+-----------------+
| sub_3_year_date |
+-----------------+
| 2019-12-25      |
+-----------------+

-- Leap day handling (from leap year February 29th subtract 1 year to non-leap year February 28th)
SELECT YEARS_SUB('2020-02-29', 1) AS leap_day_adjust_1;
+-------------------+
| leap_day_adjust_1 |
+-------------------+
| 2019-02-28        |
+-------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2024-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 0000-01-01, -1 out of range
```
