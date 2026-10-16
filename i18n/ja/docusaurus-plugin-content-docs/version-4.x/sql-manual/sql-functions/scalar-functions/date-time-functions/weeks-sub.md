---
{
    "title": "WEEKS_SUB",
    "language": "ja",
    "description": "WEEKS_SUB 関数は、指定した日付または時刻の値から指定した週数を減算（または加算）するために使用します。"
}
---

## 説明
WEEKS_SUB 関数は、指定した日付または時刻の値から指定した週数を減算（または加算）し、調整後の日付または時刻を返します（実質的には weeks_value × 7 日を減算します）。DATE、DATETIME、TIMESTAMPTZ 型に対応しています。

この関数は、WEEK を単位として使用する MySQL の [weeks_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub) と同じ動作をします。

## 構文
```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時の値。date/datetime/timestamptz 型に対応しています。具体的な形式については、[timestamptz 型への変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime 型への変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date 型への変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。|
| `week_period` | INT 型の整数。減算する週数を表します（正の値で減算、負の値で加算）。 |

## 戻り値
指定した週数を減算した日付または時刻を返します。戻り値の型は最初のパラメータの型によって決まります。

- 入力が DATE 型の場合、戻り値は DATE 型です（年、月、日のみを調整します）。
- 入力が DATETIME 型の場合、戻り値は DATETIME 型です（年、月、日を調整し、時、分、秒は変更しません）。
- 入力が TIMESTAMPTZ 型の場合、戻り値は TIMESTAMPTZ 型です（日付、時刻、タイムゾーンオフセットを含みます）。

特殊なケース:
- `<weeks_value>` が負の値の場合、週数を加算します（WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`) と同等です）。
- いずれかの入力パラメータが NULL の場合、NULL を返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合、エラーを返します。
  
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

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| WEEKS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-03 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_sub of 9999-12-31, 1 out of range
```
