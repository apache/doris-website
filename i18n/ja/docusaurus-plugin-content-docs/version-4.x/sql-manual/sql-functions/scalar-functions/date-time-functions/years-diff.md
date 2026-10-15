---
{
    "title": "YEARS_DIFF",
    "language": "ja",
    "description": "YEARSDIFF 関数は、二つの日付または時刻の値の間の満年数を計算します。"
}
---

## 説明

YEARS_DIFF 関数は、二つの日付または時刻の値の間の満年数を計算し、開始日時から終了日時までの年数を返します。DATE 型と DATETIME 型を処理でき、計算時には月、日、時、分、秒を含む時間差全体を考慮します。

## 構文

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr1>` | 終了日。DATE 型と DATETIME 型に対応します。日付・日時の形式については、[DATETIME 型への変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE 型への変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 開始日。DATE 型、DATETIME 型、および日付・時刻の形式に従った文字列に対応します。 |

## 戻り値

`<date_or_time_expr1>` と `<date_or_time_expr2>` の間の満年数を表す INT 型の整数を返します。

- `<date_or_time_expr1>` が `<date_or_time_expr2>` より後の場合、正の数を返します。ただし、満年の条件を満たす必要があります。たとえば、'2022-03-15 08:30:00' と '2021-03-15 09:10:00' の差は丸一年に満たないため、0 を返します。
- `<date_or_time_expr1>` が `<date_or_time_expr2>` より前の場合、負の数を返します。計算方法は上記と同じで、結果の符号が反転します。
- 入力が DATE 型の場合、時刻部分は 00:00:00 として扱います。
- いずれかのパラメータが NULL の場合、NULL を返します。
- 閏年の二月には特別な扱いがあります。たとえば、閏年である 2024 年の二月 29 日と 2023 年の二月 28 日の差は、丸一年とみなされます。

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
