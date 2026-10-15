---
{
    "title": "QUARTERS_SUB",
    "language": "ja",
    "description": "QUARTERS_SUB 関数は、指定した日時から指定した四半期数（1 四半期 = 3 か月）を減算または加算し、計算後の日時を返します。"
}
---

## 説明

QUARTERS_SUB 関数は、指定した日時から指定した四半期数（1 四半期 = 3 か月）を減算または加算し、計算後の日時を返します。四半期数に負数を指定すると、対応する四半期数を加算した場合と同じ結果になります。この関数は DATE、DATETIME、TIMESTAMPTZ 型の入力に対応します。

この関数は、単位に QUARTER を指定した場合の [DATE_SUB 関数](./date-sub)と同じ動作をします。

## 構文

```sql
QUARTERS_SUB(`<date_or_time_expr>`, `<quarters>`)
```

## 引数

| 引数 | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付または日時。DATE、DATETIME、TIMESTAMPTZ 型に対応します。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<quarters>` | 加算または減算する四半期数。正の整数は減算、負の整数は加算を表します。 |

## 戻り値

最初の引数の型に応じて、計算後の日付または日時を返します。

- `<quarters>` が負数の場合、基準日時に対応する四半期数を加算した場合と同じ結果になります（つまり、QUARTERS_SUB(date, -n) は QUARTERS_ADD(date, n) と同じ結果になります）。
- 入力が DATE 型（年、月、日のみ）の場合、結果は DATE 型です。入力が DATETIME 型の場合、結果は DATETIME 型で、元の時刻部分を保持します（例：'2023-04-01 12:34:56' から 1 四半期を減算すると '2023-01-01 12:34:56' になります）。
- 入力が TIMESTAMPTZ 型の場合、結果も TIMESTAMPTZ 型です（日付、時刻、タイムゾーンオフセットを含みます）。
- 入力日が月末で、移動先の月がその日付より日数の少ない月である場合、移動先の月末に自動調整されます（例：四月 30 日から 1 四半期（3 か月）を減算すると一月 31 日になります）。
- 計算結果が日付型の有効範囲（DATE 型：0000-01-01 から 9999-12-31、DATETIME 型：0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合、例外が発生します。
- いずれかの引数が NULL の場合、NULL を返します。

## 例

```sql
--- Subtract quarters from DATE type
SELECT QUARTERS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-10-31 |
+------------+

--- Subtract quarters from DATETIME type (preserves time component)
SELECT QUARTERS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-10-31 02:02:02 |
+---------------------+

--- Negative quarters (equivalent to addition)
SELECT QUARTERS_SUB('2019-10-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-31 |
+------------+

--- Non-end-of-month date subtracting quarters (direct decrement)
SELECT QUARTERS_SUB('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT QUARTERS_SUB('2023-10-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Subtracting quarters across years
SELECT QUARTERS_SUB('2024-04-01', 2) AS result;
+------------+
| result     |
+------------+
| 2023-10-01 |
+------------+

--- Returns NULL when input is NULL
SELECT QUARTERS_SUB(NULL, 1), QUARTERS_SUB('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_sub(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT QUARTERS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+--------------------------------------------------+
| QUARTERS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+--------------------------------------------------+
| 2025-07-10 12:22:33.123+08:00                    |
+--------------------------------------------------+

--- Calculation result exceeds date range
SELECT QUARTERS_SUB('0000-04-30', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 0000-04-30, 1 out of range

SELECT QUARTERS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_sub of 9999-12-31, -1 out of range
```
