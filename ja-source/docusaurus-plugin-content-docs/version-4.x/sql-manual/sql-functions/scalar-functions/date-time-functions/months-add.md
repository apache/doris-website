---
{
  "title": "MONTHS_ADD",
  "description": "MONTHSADD関数は、入力されたdatetime値に指定された月数を加算し、結果として得られる新しいdatetime値を返します。",
  "language": "ja"
}
---
## 説明

MONTHS_ADD関数は、入力されたdatetime値に指定された月数を加算し、結果として得られる新しいdatetime値を返します。この関数はDATEとDATETIME型の処理をサポートします。負の数が入力された場合、対応する月数を減算することと同等です。

この関数は、MONTHを単位として使用する場合の[date_add function](./date-add)およびMySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add)と一致しています。

## 構文

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力される日時値。date/datetime型をサポートします。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<nums>` | 加算または減算する月数。INT型です。負の数は日時からnums月を減算することを示し、正の数はnums月を加算することを示します。 |

## Return Value

入力の`<date_or_time_expr>`と同じ型（DATEまたはDATETIME）の値を返し、基準時間に指定された月数を加算した結果を表します。

- `<nums>`が負の場合、この関数は基準時間から対応する月数を減算するのと同じ動作をします（つまり、MONTHS_ADD(date, -n)はMONTHS_SUB(date, n)と等価です）。
- 入力がDATE型の場合（年、月、日のみを含む）、結果はDATE型のまま残ります。入力がDATETIME型の場合、結果は元の時間コンポーネントを保持します（例：'2023-01-01 12:34:56'は1ヶ月加算後に'2023-02-01 12:34:56'になります）。
- 入力日付が月の最終日で、対象月がその日付よりも少ない日数の場合、対象月の最終日に自動的に調整されます（例：1月31日に1ヶ月を加算すると、うるう年かどうかに応じて2月28日または29日になります）。
- 計算結果が日付型の有効範囲を超える場合（DATE型：0000-01-01から9999-12-31、DATETIME型：0000-01-01 00:00:00から9999-12-31 23:59:59）、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql
-- Add months to DATE type
SELECT MONTHS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

-- Add months to DATETIME type (preserves time component)
SELECT MONTHS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-29 02:02:02 |
+---------------------+

-- Negative months (equivalent to subtraction)
SELECT MONTHS_ADD('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

-- Non-end-of-month date adding months (direct accumulation)
SELECT MONTHS_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-13 22:28:18 |
+---------------------+

-- DATETIME with microseconds (preserves precision)
SELECT MONTHS_ADD('2023-07-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

-- Returns NULL when input is NULL
SELECT MONTHS_ADD(NULL, 5), MONTHS_ADD('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_add(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

-- Calculation result exceeds date range
SELECT MONTHS_ADD('9999-12-31', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 9999-12-31, 1 out of range

SELECT MONTHS_ADD('0000-01-01', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 0000-01-01, -1 out of range
```
