---
{
  "title": "MONTH_FLOOR",
  "language": "ja",
  "description": "monthfloor関数は、入力されたdatetime値を指定された月間隔の最も近い値に切り下げます。originが指定されている場合、"
}
---
## 説明

month_floor関数は、入力されたdatetime値を指定された月間隔の最も近い値に切り下げます。originが指定された場合、それをベースラインとして使用します。そうでなければ、デフォルトで0001-01-01 00:00:00となります。

日付計算式:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$はベースライン時刻から対象時刻までの期間数を表します。

## 構文

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```
## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 切り下げる datetime 値。DATETIME/DATE/TIMESTAMPTZ 型をサポート。Date 型は対応する日付の開始時刻 00:00:00 に変換されます。具体的な形式については [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を、datetime/date 形式については [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<period>` | 月間隔値、INT 型、各間隔に含まれる月数を表します。 |
| `<origin>` | 間隔の開始時点、DATETIME および DATE 型。デフォルト値は 0001-01-01 00:00:00 です。 |

## 戻り値

DATETIME 型の値を返します。入力された datetime に基づいて、指定された月間隔の最も近い値に切り下げられた時刻値を表します。結果の時刻部分は 00:00:00 に設定され、日の部分は 01 に切り詰められます。

- `<period>` が非正数（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- period が指定されていない場合、デフォルトで 1 ヶ月間隔となります。
- `<origin>` が指定されていない場合、デフォルトで 0001-01-01 00:00:00 がベースラインとなります。
- 入力が DATE 型（年、月、日のみを含む）の場合、その時刻部分はデフォルトで 00:00:00 となります。
- `<origin>` の日時が `<period>` より後の場合でも、上記の公式に従って計算されますが、期間 k は負の値になります。
- date_or_time_expr にスケールがある場合、返される結果にもスケールが含まれ、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換され（例：session 変数が `+08:00` の場合、`2025-12-31 23:59:59+05:00` は local_time `2026-01-01 02:59:59` を表します）、その後 FLOOR 計算を実行します。
- 入力時刻値（`<datetime>` および `<period>`）が TIMESTAMPTZ と DATETIME 型の両方を含む場合、出力は DATETIME 型になります。

## 例

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding down with default origin point
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Only with origin date and specified date
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing the FLOOR operation
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
