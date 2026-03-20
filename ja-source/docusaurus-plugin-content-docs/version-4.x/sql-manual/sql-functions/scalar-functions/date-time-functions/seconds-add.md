---
{
  "title": "SECONDS_ADD",
  "description": "SECONDSADD関数は、指定されたdatetime値に対して指定された秒数を加算または減算し、計算されたdatetime値を返します。",
  "language": "ja"
}
---
## 説明

SECONDS_ADD関数は、指定されたdatetime値に対して指定された秒数を加算または減算し、計算されたdatetime値を返します。この関数はDATEとDATETIME型の処理をサポートしています。負の数が入力された場合、対応する秒数を減算することと同等です。

この関数は、SECONDを単位として使用する場合、[date_add function](./date-add)およびMySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一致しています。

## 構文

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<date_or_time_expr>` | 必須。入力されるdatetime値。DATE型またはDATETIME型を指定可能。特定のdatetime/date形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<seconds>` | 必須。加算または減算する秒数。整数型（BIGINT）をサポート。正の数は秒の加算を示し、負の数は秒の減算を示します。 |

## Return Value

入力された `<date_or_time_expr>` と同じ型のdatetime値を返します。

- `<seconds>` が負の値の場合、関数は基準時刻から対応する秒数を減算するのと同じ動作をします（つまり、SECONDS_ADD(date, -n) は SECONDS_SUB(date, n) と同等です）。
- 入力がDATE型の場合（年、月、日のみを含む）、時刻部分はデフォルトで00:00:00となります。
- 計算結果が日付型の有効範囲を超える場合（DATE型: 0000-01-01 から 9999-12-31; DATETIME型: 0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql
--- Add seconds to DATETIME type
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds from DATETIME type (using negative number)
SELECT SECONDS_ADD('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds across minute boundary
SELECT SECONDS_ADD('2023-07-13 23:59:50', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-14 00:00:05 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_ADD('2023-01-01', 3600) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 01:00:00 |
+---------------------+

--- DATETIME with scale (preserves precision)
SELECT SECONDS_ADD('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:27.123456 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_ADD(NULL, 30), SECONDS_ADD('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_add(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 9999-12-31 23:59:59, 2 out of range

select seconds_add('0000-01-01 00:00:30',-31);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:30, -31 out of range
```
