---
{
  "title": "WEEKS_SUB",
  "language": "ja",
  "description": "WEEKSSUB関数は、指定された日付または時刻値から指定された週数を減算（または加算）するために使用されます。"
}
---
## 説明
WEEKS_SUB関数は、指定された日付または時刻値から指定された週数を減算（または加算）し、調整された日付または時刻を返します（実質的にweeks_value × 7日を減算します）。DATE、DATETIME、およびTIMESTAMPTZ型の処理をサポートしています。

この関数は、MySQLでWEEKを単位として使用する[weeks_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub)と一致しています。

## 構文

```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```
## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | 入力日時値、date/datetime/timestamptz型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `week_period` | INT型の整数で、減算する週数を表します（正の値は減算、負の値は加算）。 |

## Return Value
指定された週数を減算した日付または時刻を返します。戻り値の型は最初のパラメータの型によって決定されます：

- 入力がDATE型の場合、戻り値はDATE型です（年、月、日のみ調整）。
- 入力がDATETIME型の場合、戻り値はDATETIME型です（年、月、日が調整され、時、分、秒は変更されません）。
- 入力がTIMESTAMPTZ型の場合、戻り値はTIMESTAMPTZ型です（日付、時刻、タイムゾーンオフセットを含む）。

特殊なケース：
- `<weeks_value>`が負の数の場合は週の加算を示します（WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`)と同等）。
- 入力パラメータのいずれかがNULLの場合、NULLを返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返します。
  
## Examples

```sql
-- DATETIME type subtract 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_SUB('2023-10-01 08:30:45', 1) AS sub_1_week_datetime;
+---------------------+
| sub_1_week_datetime |
+---------------------+
| 2023-09-24 08:30:45 |
+---------------------+

-- DATETIME type add 1 week (negative weeks_value, cross-month)
SELECT WEEKS_SUB('2023-09-24 14:20:10', -1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-01 14:20:10 |
+---------------------+

-- DATE type subtract 2 weeks (only adjust date, no time portion)
SELECT WEEKS_SUB('2023-06-03', 2) AS sub_2_week_date;
+-----------------+
| sub_2_week_date |
+-----------------+
| 2023-05-20      |
+-----------------+

-- Cross-year subtraction (early January minus 1 week, to late December of previous year)
SELECT WEEKS_SUB('2024-01-01', 1) AS cross_year_sub;
+----------------+
| cross_year_sub |
+----------------+
| 2023-12-25     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-03 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 9999-12-31, 1 out of range
```
