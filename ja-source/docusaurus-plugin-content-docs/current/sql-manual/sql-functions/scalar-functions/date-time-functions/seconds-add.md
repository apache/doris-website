---
{
  "title": "SECONDS_ADD",
  "language": "ja",
  "description": "SECONDSADD関数は、指定されたdatetime値に対して指定された秒数を加算または減算し、計算されたdatetime値を返します。"
}
---
## 説明

SECONDS_ADD関数は、指定されたdatetime値に指定された秒数を加算または減算し、計算されたdatetime値を返します。この関数はDATE、DATETIME、およびTIMESTAMPTZ型の処理をサポートしています。負の数が入力された場合、対応する秒数を減算することと同等です。

この関数は、SECONDを単位として使用する場合、[date_add function](./date-add)およびMySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add)と一致しています。

## 構文

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 必須。入力される日時値。DATE、DATETIME、またはTIMESTAMPTZ型を使用できます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<seconds>` | 必須。加算または減算する秒数。整数型（BIGINT）をサポートします。正の数は秒の加算を、負の数は秒の減算を示します。 |

## 戻り値

ベース時刻 `<date_or_time_expr>` に指定された秒数 `<second>` を加算して返します。戻り値の型は最初のパラメータの型によって決定されます：
- 最初のパラメータの型がDATE/DATETIMEの場合、戻り値の型はDATETIMEになります。
- 最初のパラメータの型がTIMESTAMPTZの場合、戻り値の型はTIMESTAMPTZになります。

特殊ケース：
- `<seconds>` が負の値の場合、この関数はベース時刻から対応する秒数を減算する場合と同じ動作をします（つまり、SECONDS_ADD(date, -n) は SECONDS_SUB(date, n) と等価です）。
- 入力がDATE型（年、月、日のみ含む）の場合、時刻部分はデフォルトで00:00:00になります。
- 計算結果が日付型の有効範囲を超える場合（DATE型：0000-01-01から9999-12-31、DATETIME/TIMESTAMPTZ型：0000-01-01 00:00:00から9999-12-31 23:59:59.999999）、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

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

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:34.123+08:00                   |
+-------------------------------------------------+

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
