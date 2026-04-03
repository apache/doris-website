---
{
  "title": "MINUTES_ADD",
  "language": "ja",
  "description": "MINUTESADD関数は、入力されたdatetime値に指定された分数を加算し、結果として得られる新しいdatetime値を返します。"
}
---
## 説明

MINUTES_ADD関数は、入力されたdatetime値に指定された分数を加算し、結果として得られる新しいdatetime値を返します。この関数はDATE、DATETIME、TIMESTAMPTZ型の処理をサポートしています。

この関数は、MINUTEを単位として使用する場合、[date_add function](./date-add)およびMySQLの[date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add)と一貫性があります。

## 構文

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力datetime値で、DATE、DATETIME、またはTIMESTAMPTZ型を指定できます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<minutes>` | 追加する分数で、BIGINT型です。 |

## 戻り値

基準時刻 `<datetime_like_type>` に指定された分数 `<minutes>` を追加した結果を返します。戻り値の型は最初のパラメータの型に関連します：
- 最初のパラメータがTIMESTAMPTZの場合、TIMESTAMPTZを返します。
- 最初のパラメータがDATETIMEの場合、DATETIMEを返します。

特別なケース：
- `<minutes>` が負の場合、この関数は基準時刻から対応する分数を減算するのと同じ動作をします（つまり、MINUTES_ADD(date, -n)はMINUTES_SUB(date, n)と同等です）。
- 入力がDATE型（年、月、日のみを含む）の場合、その時刻部分はデフォルトで00:00:00となります。
- 入力datetimeにマイクロ秒が含まれている場合、分を追加した後も元のマイクロ秒精度が保持されます（例：'2023-01-01 00:00:00.123456'は1分追加後に'2023-01-01 00:01:00.123456'となります）。
- 計算結果がDATETIME型の有効範囲（0000-01-01 00:00:00から9999-12-31 23:59:59.999999）を超える場合、例外がスローされます。
- いずれかのパラメータがNULLの場合、NULLを返します。

## 例

```sql
-- Add minutes to DATE type (default time 00:00:00)
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

-- Add minutes to DATETIME
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to subtraction)
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| MINUTES_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:23:33.123+08:00                   |
+-------------------------------------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_add of 9999-12-31 23:59:59, 2 out of range
```
