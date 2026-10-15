---
{
    "title": "MONTHS_SUB",
    "language": "ja",
    "description": "MONTHS_SUB 関数は、入力された日時値から指定した月数を減算し、計算後の日時値を返します。"
}
---

## 説明

MONTHS_SUB 関数は、入力された日時値から指定した月数を減算し、計算後の日時値を返します。DATE、DATETIME、TIMESTAMPTZ 型を処理できます。負の数を指定した場合は、対応する月数を加算するのと同じです。

単位に MONTH を使用する場合、この関数は [date_sub 関数](./date-sub) および MySQL の [date_sub 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub) と同じ動作をします。

## 構文

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 月数を減算する対象の日付または日時値。DATE、DATETIME、TIMESTAMPTZ 型をサポートします。各型の形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<nums>` | 減算する月数。型は INT です。正の値を指定すると日時値からその月数を減算し、負の値を指定すると対応する月数を加算します。 |

## 戻り値

入力の `<date_or_time_expr>` と同じ型（DATE、DATETIME、TIMESTAMPTZ）の値を返します。この値は、元の日時から指定した月数を減算した結果を表します。

- `<nums>` が負の場合、元の日時に対応する月数を加算したときと同じ動作になります（つまり、MONTHS_SUB(date, -n) は MONTHS_ADD(date, n) と同じです）。
- 入力日付が月末で、対象月の日数が入力日付の日より少ない場合、対象月の末日に自動的に調整されます（たとえば、三月31日から1か月減算すると、うるう年かどうかに応じて二月28日または29日になります）。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 から 9999-12-31、DATETIME 型: 0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合は、エラーを返します。
- いずれかのパラメータが NULL の場合は、NULL を返します。

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
