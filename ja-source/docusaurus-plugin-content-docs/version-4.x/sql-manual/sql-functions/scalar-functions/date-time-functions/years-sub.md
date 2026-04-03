---
{
  "title": "YEARS_SUB",
  "description": "YEARSSUB関数は、指定された日付または時刻の値から指定された年数を減算（または加算）するために使用されます。",
  "language": "ja"
}
---
## 説明

YEARS_SUB関数は、指定された日付または時刻値から指定された年数を減算（または加算）するために使用され、調整された日付または時刻を返します（本質的にyears_value × 1年を減算します）。DATEとDATETIME型の処理をサポートし、年数は正の値（減算）または負の値（加算）を指定できます。

この関数は、MySQLでYEARを単位として使用する[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と一貫した動作をします。

## 構文

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時値で、date/datetimeタイプをサポートします。datetimeとdateのフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<years>` | 減算する年数、タイプはINTで、正の数は減算を示し、負の数は加算を示します |

## 戻り値

入力タイプ（DATEまたはDATETIME）と一致する結果を返し、調整された日付または時刻を表します：

- 入力がDATEタイプの場合、戻り値はDATEタイプのまま（年、月、日のみ調整）。
- 入力がDATETIMEタイプの場合、戻り値はDATETIMEタイプのまま（年、月、日が調整され、時、分、秒は変更されない）。
- `<years_value>`が負の数の場合は年の加算を示す（YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`)と等価）。
- 入力パラメータのいずれかがNULLの場合、NULLを返す。
- 計算結果が有効な日付タイプの範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返す。
- 調整後の月に十分な日数がない場合（例：うるう年の2月29日から1年引いてうるう年でない年の2月28日にする場合）、その月の実際の日数に自動調整される。

## 例

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

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 0000-01-01, -1 out of range
```
