---
{
    "title": "QUARTERS_ADD",
    "language": "ja",
    "description": "QUARTERS_ADD 関数は、指定した日時値に指定した四半期数（1 四半期 = 3 か月）を加算または減算し、計算後の日時値を返します。"
}
---

## 説明

QUARTERS_ADD 関数は、指定した日時値に指定した四半期数（1 四半期 = 3 か月）を加算または減算し、計算後の日時値を返します。この関数は DATE 型と DATETIME 型の処理に対応します。負の数を指定すると、その数に相当する四半期を減算します。この関数は DATE、DATETIME、TIMESTAMPTZ 型の入力に対応します。

この関数は、単位に QUARTER を指定した場合の[date_add 関数](./date-add)と同じ動作をします。

## 構文

```sql
QUARTERS_ADD(`<date_or_time_expr>`, `<quarters>`)
```

## 引数

| 引数 | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付または日時の値。DATE、DATETIME、TIMESTAMPTZ 型に対応します。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<quarters>` | 加算または減算する四半期数。正の整数は加算、負の整数は減算を表します。 |

## 戻り値

入力した日付の型に対応する日付値を返します。戻り値の型は、最初の引数の型によって決まります。

- `<quarters>` が負の場合、基準日時から対応する四半期数を減算するのと同じ動作になります（つまり、QUARTERS_ADD(date, -n) は QUARTERS_SUB(date, n) と同等です）。
- 入力が DATE 型（年、月、日のみを含む）の場合、結果は DATE 型です。入力が DATETIME 型の場合、結果は DATETIME 型で、元の時刻部分が保持されます（たとえば、'2023-01-01 12:34:56' に 1 四半期を加算すると '2023-04-01 12:34:56' になります）。
- 入力が TIMESTAMPTZ 型の場合、戻り値も TIMESTAMPTZ 型で、日付、時刻、タイムゾーンオフセットを含みます。
- 入力日が月末日で、加算後の月の日数がその日付より少ない場合、加算後の月の末日に自動的に調整されます（たとえば、一月の 31 日に 1 四半期（3 か月）を加算すると、四月の 30 日になります）。
- 計算結果が日付型の有効範囲（DATE 型：0000-01-01 から 9999-12-31、DATETIME 型：0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合、例外が発生します。
- いずれかの引数が NULL の場合、NULL を返します。

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
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 9999-10-31, 6 out of range

SELECT QUARTERS_ADD('0000-01-01',-2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 0000-01-01, -6 out of range
```
