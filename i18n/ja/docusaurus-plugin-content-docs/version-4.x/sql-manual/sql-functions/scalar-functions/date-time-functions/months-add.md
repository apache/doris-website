---
{
    "title": "MONTHS_ADD",
    "language": "ja",
    "description": "MONTHS_ADD 関数は、入力した日時の値に指定した月数を加え、計算後の日時の値を返します。"
}
---

## 説明

MONTHS_ADD 関数は、入力した日時の値に指定した月数を加え、計算後の日時の値を返します。DATE、DATETIME、TIMESTAMPTZ 型に対応します。負の数を指定すると、その月数を減算した場合と同じ結果になります。

月を単位として使用する場合、この関数の動作は [date_add 関数](./date-add)および MySQL の [date_add 関数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add)と同じです。

## 構文

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日時の値。DATE、DATETIME、TIMESTAMPTZ 型に対応します。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<nums>` | 加算または減算する月数を表す INT 型の値。負の数は日時からその月数を減算し、正の数は加算します。 |

## 戻り値

基準となる日時に指定した月数を加算した結果を、入力した `<date_or_time_expr>` と同じ型（DATE、DATETIME、TIMESTAMPTZ）で返します。

- `<nums>` が負の場合、基準となる日時から対応する月数を減算した場合と同じ結果になります（MONTHS_ADD(date, -n) は MONTHS_SUB(date, n) と同じです）。
- 入力した日付が月末日で、計算後の月の日数がその日付の日より少ない場合、計算後の月末日に自動的に調整されます（例: 1 月 31 日にひと月を加えると、うるう年かどうかに応じて翌月の 28 日または 29 日になります）。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 ～ 9999-12-31、DATETIME 型: 0000-01-01 00:00:00 ～ 9999-12-31 23:59:59）を超えると、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。

## 例

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

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MONTHS_ADD('2025-10-10 11:22:33.123+07:00', 1);
+------------------------------------------------+
| MONTHS_ADD('2025-10-10 11:22:33.123+07:00', 1) |
+------------------------------------------------+
| 2025-11-10 12:22:33.123+08:00                  |
+------------------------------------------------+

-- Returns NULL when input is NULL
SELECT MONTHS_ADD(NULL, 5), MONTHS_ADD('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_add(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

-- Calculation result exceeds date range
SELECT MONTHS_ADD('9999-12-31', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 9999-12-31, 1 out of range

SELECT MONTHS_ADD('0000-01-01', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_add of 0000-01-01, -1 out of range
```
