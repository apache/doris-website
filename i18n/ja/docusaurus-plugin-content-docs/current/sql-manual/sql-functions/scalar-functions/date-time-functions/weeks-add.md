---
{
  "title": "WEEKS_ADD",
  "language": "ja",
  "description": "WEEKSADD関数は、指定された日付または時刻値に指定された週数を加算（または減算）するために使用されます。"
}
---
## 説明

WEEKS_ADD関数は、指定された日付または時刻値に対して指定した週数を加算（または減算）するために使用され、元の日付に7日を加算/減算することと同等で、調整された日付または時刻を返します。この関数はDATE、DATETIME、TIMESTAMPTZ入力タイプをサポートします。

この関数は、MySQLでWEEKを単位として使用する[weeks_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add)と一貫した動作をします。

## 構文

```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```
## Parameters
| Parameter | Description |
|-----------|-------------|
| `<datetime_or_date_expr>` | 入力日時値。date/datetime/timestamptz型をサポート。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<weeks_value>` | INT型の整数。加算または減算する週数を表す（正数で加算、負数で減算） |

## 戻り値

指定された週数を加算した日時を返します。戻り値の型は最初のパラメータの型によって決まります：

- 入力がDATE型の場合、戻り値はDATE型（年、月、日のみ調整）
- 入力がDATETIME型の場合、戻り値はDATETIME型（年、月、日が調整され、時、分、秒は変更なし）
- 入力がTIMESTAMPTZ型の場合、戻り値はTIMESTAMPTZ型（日付、時刻、タイムゾーンオフセットを含む）

特殊なケース：
- `<weeks_value>`が負数の場合は週の減算を示します
- 入力パラメータがNULLの場合、NULLを返します
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超える場合、エラーを返します

## 例

```sql
-- DATETIME type add 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME type subtract 1 week (negative weeks, cross-month)
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

-- DATE type add 2 weeks (only adjust date, no time portion)
SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- Cross-year addition (late December plus 1 week, to early January next year)
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-17 12:22:33.123+08:00                 |
+-----------------------------------------------+
```
