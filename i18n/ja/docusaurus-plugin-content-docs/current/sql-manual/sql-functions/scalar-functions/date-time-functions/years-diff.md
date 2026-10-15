---
{
    "title": "YEARS_DIFF",
    "language": "ja",
    "description": "YEARSDIFF 関数は、二つの日付または時刻の値の間の満年数の差を計算します。"
}
---

## 説明

YEARS_DIFF 関数は、二つの日付または時刻の値の間の満年数の差を計算します。結果は開始時刻から終了時刻までの年数です。DATE、DATETIME、TIMESTAMP_NS 型に対応し、計算時には月、日、時、分、秒を含む時間差全体を考慮します。

## 構文

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr1>` | 終了日。DATE、DATETIME、TIMESTAMP_NS 型に対応します。DATETIME と DATE の形式については、[日時の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。DATE、DATETIME、TIMESTAMP_NS 型、および日時形式に準拠した文字列に対応します。 |

## 戻り値

`<date_or_time_expr1>` と `<date_or_time_expr2>` の間の満年数の差を表す INT 型の整数を返します。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合は、正の数を返します。ただし、満一年が経過している必要があります。たとえば、'2022-03-15 08:30:00' と '2021-03-15 09:10:00' の差は満一年に満たないため、0 を返します。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合は、負の数を返します。計算方法は上記と同じで、結果の符号が反転します。
- 入力が DATE 型の場合、時刻部分は 00:00:00 として扱います。
- いずれかの引数が NULL の場合は、NULL を返します。
- うるう年の二月には特別な扱いがあります。たとえば、うるう年の 2024 年の二月 29 日と、2023 年の二月 28 日の差は満一年になります。

## 例

```sql
-- Year difference of 1 year, and month-day equal (full year)
SELECT YEARS_DIFF('2020-12-25', '2019-12-25') AS diff_full_year;
+----------------+
| diff_full_year |
+----------------+
|              1 |
+----------------+

-- Year difference of 1 year, but end month-day earlier than start month-day (less than a year)
SELECT YEARS_DIFF('2020-11-25', '2019-12-25') AS diff_less_than_year;
+---------------------+
| diff_less_than_year |
+---------------------+
|                   0 |
+---------------------+

-- DATETIME type with time components
SELECT YEARS_DIFF('2022-03-15 08:30:00', '2021-03-15 09:10:00') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             0 |
+---------------+

-- Mixed DATE and DATETIME calculation, DATE type input defaults time part to 00:00:00
SELECT YEARS_DIFF('2024-05-20', '2020-05-20 12:00:00') AS diff_mixed;
+------------+
| diff_mixed |
+------------+
|          3 |
+------------+

-- End time earlier than start time, returns negative number
SELECT YEARS_DIFF('2018-06-10', '2020-06-10') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -2 |
+---------------+

-- Special leap year February case (2024 is a leap year, February 29th vs February 28th 2023, constitutes a full year)
SELECT YEARS_DIFF('2024-02-29', '2023-02-28') AS leap_year_diff;
+----------------+
| leap_year_diff |
+----------------+
|              1 |
+----------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  YEARS_DIFF(NULL, '2023-03-15') AS null_input1,
  YEARS_DIFF('2023-03-15', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
