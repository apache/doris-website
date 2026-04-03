---
{
  "title": "QUARTERS_ADD",
  "language": "ja",
  "description": "QUARTERSADD関数は、指定されたdatetime値に対して指定された四半期数（1四半期 = 3か月）を加算または減算するために使用され、戻り値は"
}
---
## 説明

QUARTERS_ADD関数は、指定されたdatetime値に対して指定された四半期数（1四半期 = 3ヶ月）を加算または減算し、計算されたdatetime値を返すために使用されます。この関数はDATEおよびDATETIME型の処理をサポートします。負の数が入力された場合、対応する四半期数を減算することと同等になります。この関数はDATE、DATETIMEおよびTIMESTAMPTZ入力型をサポートします。

この関数は、QUARTERを単位として使用する場合の[date_add function](./date-add)と一貫性があります。

## 構文

```sql
QUARTERS_ADD(`<date_or_time_expr>`, `<quarters>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付またはdatetime値。date/datetime/timestamptz型をサポート。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<quarters>` | 加算または減算する四半期の数。正の整数は加算を示し、負の整数は減算を示します。 |

## 戻り値

入力した日付型と一致する日付値を返します。戻り値の型は最初のパラメータの型によって決まります：
- `<quarters>`が負の場合、この関数は基準時刻から対応する四半期数を減算することと同じ動作をします（つまり、QUARTERS_ADD(date, -n)はQUARTERS_SUB(date, n)と同等です）。
- 入力がDATE型（年、月、日のみを含む）の場合、結果はDATE型になります。入力がDATETIME型の場合、結果はDATETIME型になり、元の時刻コンポーネントが保持されます（例：'2023-01-01 12:34:56'は1四半期を加算すると'2023-04-01 12:34:56'になります）。
- 入力がTIMESTAMPTZ型の場合、戻り値はTIMESTAMPTZ型です（日付、時刻、タイムゾーンオフセットを含む）。
- 入力日付が月末日で、対象月がその日付より少ない日数しかない場合、対象月の末日に自動的に調整されます（例：1月31日に1四半期（3か月）を加算すると4月30日になります）。
- 計算結果が日付型の有効範囲を超える場合（DATE型：0000-01-01から9999-12-31、DATETIME型：0000-01-01 00:00:00から9999-12-31 23:59:59）、例外をスローします。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

```sql
--- Add quarters to DATE type
SELECT QUARTERS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-04-30 |
+------------+

--- Add quarters to DATETIME type (preserves time component)
SELECT QUARTERS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-04-30 02:02:02 |
+---------------------+

--- Negative quarters (equivalent to subtraction)
SELECT QUARTERS_ADD('2020-04-30', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-30 |
+------------+

--- Non-end-of-month date adding quarters (direct accumulation)
SELECT QUARTERS_ADD('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT QUARTERS_ADD('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

--- Adding quarters across years
SELECT QUARTERS_ADD('2023-10-01', 2) AS result;
+------------+
| result     |
+------------+
| 2024-04-01 |
+------------+

--- Returns NULL when input is NULL
SELECT QUARTERS_ADD(NULL, 1), QUARTERS_ADD('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_add(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT QUARTERS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+--------------------------------------------------+
| QUARTERS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+--------------------------------------------------+
| 2026-01-10 12:22:33.123+08:00                    |
+--------------------------------------------------+

--- Calculation result exceeds date range
SELECT QUARTERS_ADD('9999-10-31', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-10-31, 6 out of range

SELECT QUARTERS_ADD('0000-01-01',-2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -6 out of range
```
