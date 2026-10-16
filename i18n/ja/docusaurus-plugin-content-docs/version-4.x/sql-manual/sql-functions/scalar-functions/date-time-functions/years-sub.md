---
{
    "title": "YEARS_SUB",
    "language": "ja",
    "description": "YEARS_SUB 関数は、指定した日付または時刻の値から指定した年数を減算（または加算）します。"
}
---

## 説明

YEARS_SUB 関数は、指定した日付または時刻の値から指定した年数を減算（または加算）し、調整後の日付または時刻を返します（実質的には years_value × 1 年を減算します）。年数には正の値（減算）または負の値（加算）を指定できます。DATE 型と DATETIME 型の値を処理でき、入力型として DATE、DATETIME、TIMESTAMPTZ に対応しています。

この関数の動作は、MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) で単位に YEAR を指定した場合と同じです。

## 構文

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 入力する日時値。DATE、DATETIME、TIMESTAMPTZ 型に対応します。各形式については、[TIMESTAMPTZ 変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME 変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE 変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<years>` | 減算する年数。INT 型です。正の値は減算、負の値は加算を表します。 |

## 戻り値

調整後の日付または時刻を、入力と同じ型（DATE、DATETIME、TIMESTAMPTZ）で返します。戻り値の型は最初のパラメータの型によって決まります。

- 入力が DATE 型の場合、DATE 型を返します（年、月、日のみを調整します）。
- 入力が DATETIME 型の場合、DATETIME 型を返します（年、月、日を調整し、時、分、秒は変わりません）。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型を返します（日付、時刻、タイムゾーンオフセットを含みます）。
- `<years_value>` が負の値の場合は年数を加算します（YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`) と同等です）。
- いずれかの入力パラメータが NULL の場合は NULL を返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00 ～ 9999-12-31 23:59:59）を超える場合はエラーを返します。
- 調整後の月に該当する日がない場合（例：うるう年の二月 29 日から 1 年を減算して平年の二月 28 日になる場合）は、その月の実際の日数に合わせて自動的に調整します。

## 使用例

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
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 0000-01-01, -1 out of range
```
