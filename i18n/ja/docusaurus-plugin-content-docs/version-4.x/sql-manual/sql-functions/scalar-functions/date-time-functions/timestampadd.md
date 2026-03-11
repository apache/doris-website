---
{
  "title": "TIMESTAMPADD",
  "description": "dateadd関数と同じ機能を持ちます。TIMESTAMPADD関数は、指定された単位の指定された時間間隔を、与えられた",
  "language": "ja"
}
---
## 説明

[date_add function](./date-add)と同じ機能です。
TIMESTAMPADD関数は、指定された日時値に対して指定された単位の時間間隔を加算（または減算）し、計算された日時値を返します。この関数は複数の時間単位（秒、分、時間、日、週、月、年など）をサポートし、日時のオフセット計算を柔軟に処理できます。負の間隔は対応する時間を減算することを示します。

この関数は、MySQLの[timestampadd function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampadd)と一貫した動作をします。

## 構文

```sql
TIMESTAMPADD(<unit>, <interval>, <date_or_time_expr>)
```
## パラメータ

| Parameter             | デスクリプション                                                                                                                                                                                                                                                                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`              | 時間単位、追加する時間単位を指定します。一般的な値にはSECOND、MINUTE、HOUR、DAY、WEEK、MONTH、QUARTER、YEARがあります                                                                                                                                                                                                                                    |
| `<interval>`          | 追加する時間間隔、通常は整数で、正または負の値により時間長の加算または減算を示します                                                                                                                                                                                                                            |
| `<date_or_time_expr>` | 有効な対象日付、date/datetime型の入力をサポートします。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |

## Return Value

戻り値は、ベースのdatetimeに指定された間隔を追加した結果を表します。

- 入力がdate型で時間単位がYEAR/MONTH/WEEK/DAYの場合、date型を返します。それ以外の場合はdatetime型を返します
- 入力がdatetime型の場合、戻り値もdatetime型です
- 計算結果がDATETIME型の有効範囲（0000-01-01 00:00:00から9999-12-31 23:59:59.999999）を超える場合、例外をスローします
- `<datetime_expr>`が無効な日付（0000-00-00、2023-13-01など）または`<unit>`がサポートされていない単位の場合、例外をスローします
- いずれかのパラメータがNULLの場合、NULLを返します
- 月/年を処理する際、月末日を自動的に調整します（例：2023-01-31に1か月を加算すると、うるう年かどうかに応じて2023-02-28または2023-02-29になります）

## Examples

```sql
-- Add 1 minute
SELECT TIMESTAMPADD(MINUTE, 1, '2019-01-02') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-02 00:01:00 |
+---------------------+

-- Add 1 week (7 days)
SELECT TIMESTAMPADD(WEEK, 1, '2019-01-02') AS result;
+------------+
| result     |
+------------+
| 2019-01-09 |
+------------+

-- Subtract 3 hours
SELECT TIMESTAMPADD(HOUR, -3, '2023-07-13 10:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 07:30:00 |
+---------------------+

-- End of month plus 1 month (automatically adapts to February days)
SELECT TIMESTAMPADD(MONTH, 1, '2023-01-31') AS result;
+------------+
| result     |
+------------+
| 2023-02-28 |
+------------+

-- Cross-year add 1 year
SELECT TIMESTAMPADD(YEAR, 1, '2023-12-31 23:59:59') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-12-31 23:59:59 |
+---------------------+

-- Invalid unit
SELECT TIMESTAMPADD(MIN, 5, '2023-01-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: MIN, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Any parameter is NULL
SELECT TIMESTAMPADD(YEAR,NULL, '2023-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Unit not supported, invalid
SELECT TIMESTAMPADD(YEAR,10000, '2023-12-31 23:59:59') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 2023-12-31 23:59:59, 10000 out of range
```
