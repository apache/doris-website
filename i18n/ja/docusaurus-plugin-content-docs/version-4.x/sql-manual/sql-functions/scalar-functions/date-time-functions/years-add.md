---
{
    "title": "YEARS_ADD",
    "language": "ja",
    "description": "YEARSADD 関数は、指定した日付または時刻の値に指定した年数を加算（または減算）し、調整後の日付または時刻を返します。"
}
---

## 説明

YEARS_ADD 関数は、指定した日付または時刻の値に指定した年数を加算（または減算）し、調整後の日付または時刻を返します。年数には正の値（加算）または負の値（減算）を指定できます。この関数は DATE、DATETIME、TIMESTAMPTZ 型の入力に対応しています。

この関数の動作は、MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)で単位に YEAR を指定した場合と同じです。

## 構文

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 必須。入力する日時の値です。DATE、DATETIME、TIMESTAMPTZ 型に対応しています。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<years>` | 必須。加算する年数を表す INT 型の値です。負の値は減算、正の値は加算を示します。 |


## 戻り値

調整後の日付または時刻を、入力と同じ型（DATE、DATETIME、TIMESTAMPTZ）で返します。戻り値の型は最初の引数の型によって決まります。

- 入力が DATE 型の場合、DATE 型を返します（年、月、日のみを調整します）。
- 入力が DATETIME 型の場合、DATETIME 型を返します（年、月、日を調整し、時、分、秒は変わりません）。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型を返します（日付、時刻、タイムゾーンのオフセットを含みます）。
- `<years_value>` が負の値の場合は年数を減算します（YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`) と同等です）。
- いずれかの入力引数が NULL の場合は、NULL を返します。
- 計算結果が有効な日付型の範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合は、エラーを返します。
- 調整後の月に該当する日がない場合（例: 二月 29 日に 1 年を加算し、翌年がうるう年でない場合）、その月の末日に自動的に調整します（例: 2020-02-29 に 1 年を加算すると 2021-02-28 を返します）。

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
