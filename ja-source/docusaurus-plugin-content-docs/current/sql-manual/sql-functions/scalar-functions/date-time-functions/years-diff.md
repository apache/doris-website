---
{
  "title": "YEARS_DIFF",
  "language": "ja",
  "description": "YEARSDIFF関数は、2つの日付または時刻値間の完全な年数の差を計算するために使用されます。"
}
---
## 説明

YEARS_DIFF関数は、2つの日付または時刻値間の完全な年差を計算するために使用され、結果は開始時刻から終了時刻までの年数になります。DATEおよびDATETIME型の処理をサポートし、計算時に完全な時間差（月、日、時間、分、秒を含む）を考慮します。

## 構文

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr1>` | 終了日、date/datetimeタイプをサポート。datetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<date_or_time_expr2>` | 開始日、date/datetimeタイプと日時形式に準拠した文字列をサポート |

## 戻り値

`<date_or_time_expr1>`と`<date_or_time_expr2>`間の完全な年の差を表すINTタイプの整数を返します：

- `<date_or_time_expr1>`が`<date_or_time_expr2>`より後の場合、正の数を返します（「完全な年」条件を満たす必要があります。例：'2022-03-15 08:30:00'と'2021-03-15 09:10:00'は実際には1年未満の差のため、0を返します）。
- `<date_or_time_expr1>`が`<date_or_time_expr2>`より前の場合、負の数を返します（計算方法は上記と同じで、結果を負にします）。
- 入力がDATEタイプの場合、その時間部分はデフォルトで00:00:00になります。
- いずれかのパラメータがNULLの場合、NULLを返します。
- 特別な閏年2月のケース（例：2024年は閏年で、2月29日と2023年2月28日で完全な1年を構成します）

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
