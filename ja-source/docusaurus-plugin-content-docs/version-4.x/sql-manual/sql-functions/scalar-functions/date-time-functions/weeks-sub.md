---
{
  "title": "WEEKS_SUB",
  "description": "WEEKSSUB関数は、指定された日付または時刻値から指定された週数を減算（または加算）するために使用されます。",
  "language": "ja"
}
---
## 説明
WEEKS_SUB関数は、指定された日付または時刻値から指定された週数を減算（または加算）し、調整された日付または時刻を返すために使用されます（本質的にweeks_value × 7日を減算します）。この関数はDATEおよびDATETIME型の処理をサポートします。

この関数は、MySQLでWEEKを単位として使用する[weeks_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub)と一致しています。

## 構文

```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```
## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力日時値、date/datetimeタイプをサポートします。datetimeとdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `week_period` | INTタイプの整数、減算する週数を表します（正の値で減算、負の値で加算）。 |

## 戻り値
指定された週数を減算した日付または時刻を返します：

- 入力がDATEタイプの場合、戻り値はDATEタイプのまま（年、月、日のみ調整）。
- 入力がDATETIMEタイプの場合、戻り値はDATETIMEタイプのまま（年、月、日は調整され、時、分、秒は変更されない）。
- `<weeks_value>`が負の数の場合は週の加算を示します（WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`)と同等）。
- 任意の入力パラメータがNULLの場合、NULLを返します。
- 計算結果が有効な日付タイプの範囲（0000-01-01 00:00:00から9999-12-31 23:59:59）を超えた場合、エラーを返します。
  
## 例

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

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 9999-12-31, 1 out of range
```
