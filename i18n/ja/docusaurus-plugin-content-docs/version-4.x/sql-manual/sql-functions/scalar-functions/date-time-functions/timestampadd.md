---
{
    "title": "TIMESTAMPADD",
    "language": "ja",
    "description": "dateadd 関数と同じ機能を持ち、指定した単位の時間間隔を日時に加算または減算します。"
}
---

## 説明

[dateadd 関数](./date-add)と同じ機能です。
TIMESTAMPADD 関数は、指定した単位の時間間隔を日時値に加算または減算し、計算後の日時値を返します。秒、分、時、日、週、月、年など、複数の時間単位に対応しています。負の間隔を指定すると、対応する時間が減算されます。

この関数の動作は、MySQL の [TIMESTAMPADD 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampadd)と一致します。

## 構文

```sql
TIMESTAMPADD(<unit>, <interval>, <date_or_time_expr>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<unit>` | 加算する時間の単位。一般的な値は SECOND、MINUTE、HOUR、DAY、WEEK、MONTH、QUARTER、YEAR です。 |
| `<interval>` | 加算する時間間隔。通常は整数で、正の値は加算、負の値は減算を表します。 |
| `<date_or_time_expr>` | 計算対象の有効な日付。DATE 型または DATETIME 型の入力をサポートします。日時と日付の具体的な形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |

## 戻り値

基準となる日時に指定した間隔を加算した結果を返します。

- 入力が DATE 型で、時間単位が YEAR、MONTH、WEEK、DAY の場合は DATE 型を返します。それ以外の場合は DATETIME 型を返します。
- 入力が DATETIME 型の場合、戻り値も DATETIME 型です。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超えると、例外が発生します。
- `<datetime_expr>` が無効な日付（0000-00-00、2023-13-01 など）の場合、または `<unit>` がサポートされていない単位の場合は、例外が発生します。
- いずれかのパラメータが NULL の場合は NULL を返します。
- 月または年を処理する際は、月末の日付が自動的に調整されます（たとえば、2023-01-31 に 1 か月を加算すると、うるう年かどうかに応じて 2023-02-28 または 2023-02-29 になります）。

## 例

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

-- Calculation result exceeds datetime range
SELECT TIMESTAMPADD(YEAR,10000, '2023-12-31 23:59:59') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 2023-12-31 23:59:59, 10000 out of range
```
