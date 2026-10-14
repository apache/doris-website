---
{
    "title": "MONTHS_SUB",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の値から指定した月数を減算し、入力と同じ型の値を返します。"
}
---

## 説明

MONTHS_SUB 関数は、入力した日時から指定された月数を減算し、計算後の日時を返します。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応しています。負の値を指定した場合は、その絶対値に相当する月数を加算します。

この関数の動作は、単位に MONTH を指定した場合の [date_sub 関数](./date-sub) および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub) と同じです。

## 構文

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 月数を減算する基準の日付または日時。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応しています。形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<nums>` | 減算する月数。型は INT です。正の値を指定するとその月数を減算し、負の値を指定するとその絶対値の月数を加算します。 |

## 戻り値

基準の日時から指定された月数を減算した結果を、入力の `<date_or_time_expr>` と同じ型（DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ）で返します。

- `<nums>` が負の場合は、その絶対値に相当する月数を基準日時に加算します（MONTHS_SUB(date, -n) は MONTHS_ADD(date, n) と同等です）。
- 入力日が月末で、計算先の月の日数が入力日の日付より少ない場合は、計算先の月末に自動調整されます（たとえば、三月 31 日から 1 か月を減算すると、うるう年かどうかに応じて二月 28 日または 29 日になります）。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 から 9999-12-31、DATETIME 型: 0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超えると、エラーを返します。
- いずれかの引数が NULL の場合は、NULL を返します。

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
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -1 out of range

mysql> SELECT MONTHS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-12-31, 1 out of range
```
