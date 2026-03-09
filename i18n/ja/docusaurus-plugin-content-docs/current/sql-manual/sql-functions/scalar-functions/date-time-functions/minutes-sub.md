---
{
  "title": "MINUTES_SUB",
  "language": "ja",
  "description": "MINUTESSUB関数は、入力されたdatetime値から指定された分数を減算し、結果として得られる新しいdatetime値を返します。"
}
---
## 説明

MINUTES_SUB関数は、入力されたdatetime値から指定された分数を減算し、結果として得られる新しいdatetime値を返します。この関数は、DATE、DATETIME、およびTIMESTAMPTZ型の処理をサポートします。

この関数は、MINUTEを単位として使用する場合の[date_sub function](./date-sub)およびMySQLの[date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub)と一貫性があります。

## 構文

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力datetime値で、DATE、DATETIME、またはTIMESTAMPTZ型を指定できます。特定のdatetime/date形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<minutes>` | 減算する分数で、BIGINT型です。正の値または負の値を指定できます。 |

## Return Value

基準時刻`<datetime_like_type>`から指定された分数`<minutes>`を減算した結果を返します。戻り値の型は第1パラメータの型に関連します：
- 第1パラメータがTIMESTAMPTZの場合、TIMESTAMPTZを返します。
- 第1パラメータがDATETIMEの場合、DATETIMEを返します。

特殊なケース：
- `<minutes>`が負の値の場合、この関数は基準時刻に対応する分数を加算するのと同じ動作をします（つまり、MINUTES_SUB(date, -n)はMINUTES_ADD(date, n)と等価です）。
- 入力がDATE型の場合（年、月、日のみを含む）、時刻部分はデフォルトで00:00:00となります。
- 入力datetimeにマイクロ秒が含まれている場合、分数を減算した後も元のマイクロ秒精度が保持されます（例：'2023-01-01 00:01:00.123456'は1分減算後に'2023-01-01 00:00:00.123456'になります）。
- 計算結果がDATETIME型の有効範囲（0000-01-01 00:00:00から9999-12-31 23:59:59.999999）を超える場合、例外がスローされます。
- いずれかのパラメータがNULLの場合、NULLを返します。

## Examples

```sql
-- Subtract minutes from DATETIME
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to addition)
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:21:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_add of 0000-01-01 00:00:00, -1 out of range
```
