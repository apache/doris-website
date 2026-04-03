---
{
  "title": "MONTHS_SUB",
  "language": "ja",
  "description": "MONTHSSUB関数は、入力されたdatetime値から指定された月数を減算し、結果として得られる新しいdatetime値を返します。"
}
---
## 説明

MONTHS_SUB関数は、入力されたdatetime値から指定された月数を減算し、結果として得られる新しいdatetime値を返します。この関数は、DATE、DATETIME、およびTIMESTAMPTZ型の処理をサポートします。負の数が入力された場合、対応する月数を加算することと同等です。

この関数は、MONTHを単位として使用する場合、[date_sub function](./date-sub)およびMySQLの[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub)と一致します。

## 構文

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 月を減算する日付値。date/datetime/timestamptz型をサポートします。特定のフォーマットについては、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<nums>` | 減算する月数、INT型。正の数は日時からnums月を減算することを示し、負の数はnums月を加算することを示します。 |

## 戻り値

入力の`<date_or_time_expr>`と同じ型の値（DATE、DATETIME、またはTIMESTAMPTZ）を返し、基準時刻から指定された月数を減算した結果を表します。

- `<nums>`が負の場合、この関数は基準時刻に対応する月数を加算する場合と同じ動作をします（つまり、MONTHS_SUB(date, -n)はMONTHS_ADD(date, n)と等価です）。
- 入力日付が月の最終日であり、対象月がその日付より少ない日数の場合、対象月の最終日に自動的に調整されます（例：3月31日から1月を減算すると、うるう年かどうかに応じて2月28日または29日になります）。
- 計算結果が日付型の有効範囲を超える場合（DATE型：0000-01-01から9999-12-31；DATETIME型：0000-01-01 00:00:00から9999-12-31 23:59:59）、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

```sql
--- Subtract months from DATE type
SELECT MONTHS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

--- Subtract months from DATETIME type (preserves time component)
SELECT MONTHS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-12-31 02:02:02 |
+---------------------+

--- Negative months (equivalent to addition)
SELECT MONTHS_SUB('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

--- Non-end-of-month date subtracting months (direct decrement)
SELECT MONTHS_SUB('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT MONTHS_SUB('2023-10-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT MONTHS_SUB(NULL, 5), MONTHS_SUB('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_sub(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+------------------------------------------------+
| MONTHS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+------------------------------------------------+
| 2025-09-10 12:22:33.123+08:00                  |
+------------------------------------------------+

--- Calculation result exceeds date range
mysql> SELECT MONTHS_SUB('0000-01-01', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 0000-01-01, -1 out of range

mysql> SELECT MONTHS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 9999-12-31, 1 out of range
```
