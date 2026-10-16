---
{
    "title": "QUARTERS_ADD",
    "language": "ja",
    "description": "QUARTERSADD 関数は、指定した日時に指定した四半期数（1 四半期 = 3 か月）を加算または減算し、計算後の日時を返します。"
}
---

## 説明

QUARTERS_ADD 関数は、指定した日時に指定した四半期数（1 四半期 = 3 か月）を加算または減算し、計算後の日時を返します。負の数を指定すると、対応する四半期数を減算します。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の入力に対応します。

四半期を単位とする場合、この関数は [date_add 関数](./date-add)と同じ動作をします。

## 構文

```sql
QUARTERS_ADD(`<date_or_time_expr>`, `<quarters>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付または日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応します。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<quarters>` | 加算または減算する四半期数。正の整数は加算、負の整数は減算を表します。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度である `TIMESTAMP_NS` 型の値を返します。結果は戻り値の型の有効範囲に照らして検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

入力日時の型に対応する型の値を返します。戻り値の型は最初のパラメータの型によって決まります。

- `<quarters>` が負の場合、基準となる日時から対応する四半期数を減算した場合と同じ動作になります（つまり、QUARTERS_ADD(date, -n) は QUARTERS_SUB(date, n) と同じです）。
- 入力が DATE 型（年、月、日のみ）の場合、結果も DATE 型になります。入力が DATETIME 型の場合、結果も DATETIME 型になり、元の時刻部分を保持します（たとえば、'2023-01-01 12:34:56' に 1 四半期を加算すると '2023-04-01 12:34:56' になります）。
- 入力が TIMESTAMPTZ 型の場合、戻り値も TIMESTAMPTZ 型になります（日付、時刻、タイムゾーンのオフセットを含みます）。
- 入力日が月末で、加算または減算後の月の日数が入力日の日付より少ない場合、対象月の末日に自動的に調整されます（たとえば、一月 31 日に 1 四半期（3 か月）を加算すると四月 30 日になります）。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 から 9999-12-31、DATETIME 型: 0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合、例外が発生します。
- いずれかのパラメータが NULL の場合、NULL を返します。

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
