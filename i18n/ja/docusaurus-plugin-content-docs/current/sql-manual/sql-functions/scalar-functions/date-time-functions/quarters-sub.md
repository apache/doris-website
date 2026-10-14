---
{
    "title": "QUARTERS_SUB",
    "language": "ja",
    "description": "QUARTERS_SUB 関数は、指定した日時の値から指定した四半期数（1 四半期 = 3 か月）を減算または加算し、計算後の日時を返します。"
}
---

## 説明

QUARTERS_SUB 関数は、指定した日時の値から指定した四半期数（1 四半期 = 3 か月）を減算または加算し、計算後の日時を返します。この関数は DATE、DATETIME、TIMESTAMP_NS 型をサポートします。負の数を指定した場合は、対応する四半期数を加算することと同じです。この関数は DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の入力をサポートします。

QUARTER を単位として使用した場合、この関数の動作は [date_sub 関数](./date-sub) と同じです。

## 構文

```sql
QUARTERS_SUB(`<date_or_time_expr>`, `<quarters>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 入力する日付または日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。具体的な形式については、[timestamptz 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date 型の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<quarters>` | 加算または減算する四半期数。正の整数は減算、負の整数は加算を表します。 |

## 戻り値

`TIMESTAMP_NS` を入力すると、小数秒が固定の九桁精度の `TIMESTAMP_NS` を返します。結果は戻り値の型の有効範囲に対して検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

入力した日時の型に対応する値を返します。戻り値の型は最初の引数の型によって決まります。

- `<quarters>` が負の場合、基準となる日時に対応する四半期数を加算した場合と同じ結果になります（つまり、QUARTERS_SUB(date, -n) は QUARTERS_ADD(date, n) と同等です）。
- 入力が DATE 型（年、月、日のみ）の場合、結果も DATE 型になります。入力が DATETIME 型の場合、結果も DATETIME 型になり、元の時刻部分を維持します（たとえば、'2023-04-01 12:34:56' から 1 四半期を減算すると、'2023-01-01 12:34:56' になります）。
- 入力が TIMESTAMPTZ 型の場合、戻り値も TIMESTAMPTZ 型になります（日付、時刻、タイムゾーンオフセットを含みます）。
- 入力日が月末で、移動先の月の日数がその日付より少ない場合は、移動先の月末日に自動的に調整されます（たとえば、四月 30 日から 1 四半期（3 か月）を減算すると、一月 31 日になります）。
- 計算結果が日付型の有効範囲（DATE 型: 0000-01-01 から 9999-12-31、DATETIME 型: 0000-01-01 00:00:00 から 9999-12-31 23:59:59）を超える場合は、例外が発生します。
- いずれかのパラメータが NULL の場合は、NULL を返します。

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
