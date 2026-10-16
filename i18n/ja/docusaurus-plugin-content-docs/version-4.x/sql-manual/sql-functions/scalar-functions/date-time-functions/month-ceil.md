---
{
    "title": "MONTH_CEIL",
    "language": "ja",
    "description": "monthceil 関数は、入力した日時値を指定された月間隔の直近の境界まで切り上げます。origin を指定した場合は、"
}
---

## 説明


month_ceil 関数は、入力した日時を指定した月間隔の直近の境界まで切り上げます。起点を指定した場合はその日時を基準とし、省略した場合は 0001-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\begin{aligned}
&\text{month\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な期間数を表します。

## 構文

```sql
MONTH_CEIL(`<date_or_time_expr>`)
MONTH_CEIL(`<date_or_time_expr>`, `<origin>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`)
MONTH_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 切り上げる日時値。有効な日付式で、DATE、DATETIME、TIMESTAMPTZ 型に対応します。DATE 型の値は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各期間に含まれる月数を表す INT 型の値です。 |
| `<origin>` | 省略可能。期間の起点となる日時。DATE 型と DATETIME 型に対応します。既定値は 0001-01-01 00:00:00 です。 |

## 戻り値

入力日時を指定した月間隔の直近の境界まで切り上げた時刻を表す DATETIME 型の値を返します。結果の時刻部分は 00:00:00 に設定され、日部分は 01 に切り詰められます。

- `<period>` が正の数でない場合（≤0）、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- period を省略した場合、既定では 1 か月間隔になります。
- `<origin>` を省略した場合、0001-01-01 00:00:00 を基準とします。
- 入力が DATE 型の場合、時刻は既定で 00:00:00 になります。
- 計算結果が日付の最大範囲 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、期間数 k は負の値になります。
- date_or_time_expr に小数秒の桁数がある場合、戻り値にも同じ桁数があり、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、最初に local_time に変換します（例：`2025-12-31 23:59:59+05:00` は、local_time では `2026-01-01 02:59:59` に相当します。このときのセッション変数は `+08:00` です）。その後、CEIL 計算を行います。
- 入力時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。

## 例

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-08-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding up with default origin point
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_CEIL('2023-12-01 00:00:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00        |
+----------------------------+

-- Only with origin date and specified date
select month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00");
+----------------------------------------------------------+
| month_ceil("2023-07-13 22:28:18", "2022-07-04 00:00:00") |
+----------------------------------------------------------+
| 2023-08-04 00:00:00                                      |
+----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_CEIL('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-11-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MONTH_CEIL('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-03 22:20:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-12-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_CEIL('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MONTH_CEIL
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-02-01 00:00:00+08:00               |
+-----------------------------------------+

-- If the input time values contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.
SELECT MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| MONTH_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-15 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Calculation result exceeds maximum date range 9999-12-31, returns error
SELECT MONTH_CEIL('9999-12-13 22:28:18', 5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 9999-12-13 22:28:18, 5 out of range

-- Period is non-positive, returns error
SELECT MONTH_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_CEIL(NULL, 5), MONTH_CEIL('2023-07-13 22:28:18', NULL) AS result;
+----------------------+--------+
| month_ceil(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+
```
