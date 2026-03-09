---
{
  "title": "DATE_ADD",
  "language": "ja",
  "description": "DATEADD関数は、指定された日付または時刻値に指定された時間間隔を加算し、計算結果を返すために使用されます。"
}
---
## 説明

DATE_ADD関数は、指定した日付または時刻値に指定した時間間隔を加算し、計算結果を返すために使用されます。

- サポートされる入力日付タイプには、DATE、DATETIME、TIMESTAMPTZ（'2023-12-31'、'2023-12-31 23:59:59'、'2023-12-31 23:59:59+08:00'など）が含まれます。
- 時間間隔は、数値（`expr`）と単位（`time_unit`）の両方で指定されます。`expr`が正の場合は「加算」を意味し、負の場合は対応する間隔を「減算」することと同等です。

この関数は、MySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一貫して動作します。

## エイリアス

- days_add
- adddate

## 構文

```sql
DATE_ADD(<date_or_time_expr>, INTERVAL <expr> <time_unit>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | 処理される日付/時刻値。サポートされる型：datetime型またはdate型、秒の最大精度は小数点以下6桁まで（例：2022-12-28 23:59:59.999999）。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<expr>` | 追加される時間間隔。独立した単位（`YEAR`など）は`INT`型、複合単位（`YEAR_MONTH`など）は`STRING`型で、すべての非数値文字を区切り文字として受け入れます。そのため、例えば`INTERVAL 6/4 HOUR_MINUTE`は、1時間30分（6/4 == 1.5）ではなく、6時間4分としてDorisに認識されます。複合単位の場合、入力間隔値が短すぎる場合、より大きい単位の値は0に設定されます。この値の符号は、最初の非数値文字が`-`かどうかによってのみ決定されます。 |
| `<time_unit>` | 列挙値：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND、YEAR_MONTH、DAY_HOUR、DAY_MINUTE、DAY_SECOND、DAY_MICROSECOND、HOUR_MINUTE、HOUR_SECOND、HOUR_MICROSECOND、MINUTE_SECOND、MINUTE_MICROSECOND、SECOND_MICROSECOND | 

| time_unit          | 期待される形式（すべての非数値文字を区切り文字として受け入れる） |
| ------------------ | ----------------------------------------- |
| YEAR               | 'YEARS'                                   |
| QUARTER            | 'QUARTERS'                                |
| MONTH              | 'MONTHS'                                  |
| WEEK               | 'WEEKS'                                   |
| DAY                | 'DAYS'                                    |
| HOUR               | 'HOURS'                                   |
| MINUTE             | 'MINUTES'                                 |
| SECOND             | 'SECONDS'                                 |
| MICROSECOND        | 'MICROSECONDS'                            |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## 戻り値

<date_or_time_expr>と同じ型の結果を返します：
- DATE型が入力された場合、DATE（日付部分のみ）を返します
- DATETIME型が入力された場合、DATETIME（日付と時刻を含む）を返します
- TIMESTAMPTZ型が入力された場合、TIMESTAMPTZ（日付、時刻、タイムゾーンオフセットを含む）を返します
- スケール付きの入力（'2024-01-01 12:00:00.123'など）はスケールを保持し、最大で小数点以下6桁まで対応します。

特殊なケース：
- いずれかのパラメータがNULLの場合、NULLを返します
- 不正な単位または非数値のexprの場合、エラーを返します
- 複合単位で、入力部分が過剰であるか、いずれかの部分が許可される最大値922337203685477579を超える場合、エラーを返します
- 計算結果が日付型の範囲を超える場合（'0000-00-00 23:59:59'より前または'9999-12-31 23:59:59'より後など）、エラーを返します
- 翌月に入力日付に対応する十分な日数がない場合、自動的に翌月の最終日に設定されます

## Examples

```sql
-- Add days
select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+

-- Add quarters
mysql> select DATE_ADD(cast('2023-01-01' as date), INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

-- Add weeks
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

-- Add months, since February 2023 only has 28 days, January 31 plus one month returns February 28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Negative number test
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

-- Cross-year hour addition
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

-- Add DAY_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND);
+-------------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND) |
+-------------------------------------------------------------------+
| 2025-10-24 11:12:13                                               |
+-------------------------------------------------------------------+

-- Add DAY_HOUR
mysql>  select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR);
+----------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR) |
+----------------------------------------------------------+
| 2025-10-24 12:10:10                                      |
+----------------------------------------------------------+

-- For compound units, accept all non-numeric characters as separators.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR);
+----------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '   *1@#$2' DAY_HOUR) |
+----------------------------------------------------------------+
| 2025-10-24 12:10:10                                            |
+----------------------------------------------------------------+

-- Add MINUTE_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND);
+---------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND) |
+---------------------------------------------------------------+
| 2025-10-23 10:11:11                                           |
+---------------------------------------------------------------+

-- Add SECOND_MICROSECOND
mysql>  select date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND);
+---------------------------------------------------------------------------+
| date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND) |
+---------------------------------------------------------------------------+
| 2025-10-10 10:10:11.223456                                                |
+---------------------------------------------------------------------------+

-- For composite units, the sign of the time interval is determined only by whether the first non-digit character is `-`
-- All subsequent `-` are considered part of the delimiter
select 
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '#-1:-1' MINUTE_SECOND) AS first_not_sub,
        DATE_ADD('2025-10-23 10:10:10', INTERVAL '  -1:1' MINUTE_SECOND) AS first_sub;
+---------------------+---------------------+
| first_not_sub       | first_sub           |
+---------------------+---------------------+
| 2025-10-23 10:11:11 | 2025-10-23 10:09:09 |
+---------------------+---------------------+

-- For composite units, if the input time interval is too short, the value of the larger unit will be set to 0.
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1' MINUTE_SECOND) AS minute_interval_is_zero
+-------------------------+
| minute_interval_is_zero |
+-------------------------+
| 2025-10-23 10:10:11     |
+-------------------------+

-- Example of TimestampTz type, SET time_zone = '+08:00'
select DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY);
+-------------------------------------------------------+
| DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY) |
+-------------------------------------------------------+
| 2023-01-03 04:22:33+08:00                             |
+-------------------------------------------------------+

-- If the number of time intervals input is excessive, return an error
select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:2:3.4' SECOND_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation second_microsecond_add of 1:2:3.4 is invalid

-- For composite units, if the value of any part exceeds the maximum value of 922337203685477580
-- return an error
select DATE_ADD('2025-10-10 1:2:3', INTERVAL '922337203685477580' DAY_MICROSECOND);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_microsecond_add of 2025-10-10 01:02:03, 922337203685477580 out of range

-- Illegal unit
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

-- Parameter is NULL, returns NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

-- Calculated result is not in date range [0000,9999], returns error
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```
