---
{
    "title": "TIMESTAMPDIFF",
    "language": "ja",
    "description": "date-diff 関数と同じ機能を持ちます。TIMESTAMPDIFF 関数は二つの日時値の差を計算し、結果を返します。"
}
---

## 説明

[date-diff 関数](./datediff)と同じ機能を持ちます。
TIMESTAMPDIFF 関数は二つの日時値の差を計算し、指定した時間単位で結果を返します。秒、分、時、日、週、月、年など、複数の時間単位をサポートします。

この関数の動作は、MySQL の [timestampdiff 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampdiff)と一致します。

## 構文

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```

## パラメータ

| パラメータ | 説明 |
|------------|------|
| `<unit>` | 差を表す時間単位を指定します。一般的な値には SECOND、MINUTE、HOUR、DAY、MONTH、QUARTER、YEAR などがあります。 |
| `<date_or_time_expr1>` | 最初の日時値（開始日時）。DATE 型または DATETIME 型の入力をサポートします。具体的な日時と日付の形式については、[日時型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[日付型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<date_or_time_expr2>` | 二番目の日時値（終了日時）。DATE 型または DATETIME 型の入力をサポートします。 |

## 戻り値

二つの日時値の差を BIGINT 型で返します。

- `<date_or_time_expr2>` が `<date_or_time_expr1>` より後の場合は、正の数を返します。
- `<date_or_time_expr2>` が `<date_or_time_expr1>` より前の場合は、負の数を返します。
- いずれかのパラメータが NULL の場合は、NULL を返します。
- `<unit>` にサポートされていない単位を指定した場合は、エラーを返します。
- 指定した単位で差を計算する際には、より小さい単位も考慮します。たとえば、実際の差が一日に満たない場合、日単位の結果は 0 になります。
- 月単位の計算には特別なケースがあります。たとえば、1 月 31 日から 2 月 28 日までの差はひと月です。
- DATE 型の値を入力した場合、時刻部分は 00:00:00 になります。

## 使用例

```sql
-- Calculate month difference between two dates
SELECT TIMESTAMPDIFF(MONTH, '2003-02-01', '2003-05-01') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Calculate year difference (end date earlier than start date, returns negative value)
SELECT TIMESTAMPDIFF(YEAR, '2002-05-01', '2001-01-01') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

-- Calculate minute difference
SELECT TIMESTAMPDIFF(MINUTE, '2003-02-01', '2003-05-01 12:05:55') AS result;
+--------+
| result |
+--------+
| 128885 |
+--------+

-- Real difference insufficient for one day
SELECT TIMESTAMPDIFF(DAY, '2023-12-31 23:59:50', '2024-01-01 00:00:05') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Invalid unit QUARTER, returns error
SELECT TIMESTAMPDIFF(QUAR, '2023-01-01', '2023-07-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: QUAR, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Special case for month calculation (end of month crossing months)
SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-28') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-27') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL (returns NULL)
SELECT TIMESTAMPDIFF(DAY, NULL, '2023-01-01'), TIMESTAMPDIFF(DAY, '2023-01-01', NULL) AS result;
+---------------------------------------+--------+
| timestampdiff(DAY, NULL, '2023-01-01') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+

-- Week difference calculation
SELECT TIMESTAMPDIFF(WEEK, '2023-01-01', '2023-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

```
