---
{
  "title": "TIMESTAMPDIFF",
  "language": "ja",
  "description": "date-diff関数と同じ機能を持つTIMESTAMPDIFF関数は、2つのdatetime値の差を計算し、結果を返す"
}
---
## 説明

[date-diff function](./datediff)と同じ機能
TIMESTAMPDIFF関数は、2つのdatetime値の差を計算し、指定された時間単位で結果を返します。この関数は複数の時間単位（秒、分、時間、日、週、月、年など）をサポートしています。

この関数はMySQLの[date_diff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-diff)と一貫して動作します。

## 構文

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```
## パラメータ

| パラメータ                | 説明                                                                                                                                                                                                                                                                                                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`                 | 時間単位、差分を返す単位を指定します。一般的な値には SECOND、MINUTE、HOUR、DAY、MONTH、QUARTER、YEAR などがあります。                                                                                                                                                                                                                                    |
| `<date_or_time_expr1>`   | 最初の日時、開始日時。date/datetime型の入力をサポートします。具体的なdatetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<date_or_time_expr2>`   | 2番目の日時、終了日時。date/datetime型の入力をサポートします                                                                                                                                                                                                                                                                                       |

## 戻り値

2つの日時間の差分を返し、型はBIGINTです。

- `<date_or_time_expr2>` が `<date_or_time_expr1>` より後の場合、正の数を返します
- `<date_or_time_expr2>` が `<date_or_time_expr1>` より前の場合、負の数を返します
- いずれかのパラメータがNULLの場合、NULLを返します
- `<unit>` がサポートされていない単位の場合、エラーを返します
- 単位を計算する際、次の単位は無視されません。例えば、実際の差分が1日を満たすかどうかを計算し、不足している場合は0を返します
- 月計算の特別なケース：例えば、1-31から2-28は1ヶ月の差分があります
- date型を入力する場合、時間部分はデフォルトで00:00:00になります

## 例

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
