---
{
  "title": "MINUTE_CEIL",
  "language": "ja",
  "description": "MINUTE_CEIL関数は、入力されたdatetime値を指定された分の期間の最も近い値に切り上げます。originが指定されている場合はそれを基準として使用し、指定されていない場合のデフォルトの基準は0001-01-01 00:00:00です。DATETIME型の処理をサポートします。"
}
---
## Description

MINUTE_CEIL関数は、入力されたdatetime値を指定された分単位の期間の最も近い上位の値に切り上げます。originが指定されている場合は、それを基準として使用します。指定されていない場合は、0001-01-01 00:00:00がデフォルトとなります。この関数はDATETIME型の処理をサポートしています。

日付計算式：
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は、基準時刻からターゲット時刻に到達するために必要な期間の数を表します。

## Syntax

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | 切り上げ対象のdatetime値。date/datetime/timestamptz型の入力をサポート。具体的な形式については[timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 分間隔値。INT型で、各間隔に含まれる分数を表します。 |
| `<origin>` | 間隔の開始時点。DATETIME型。デフォルト値は0001-01-01 00:00:00です。 |

## 戻り値

TIMESTAMPTZ、DATETIME、またはDATE型の値を返します。入力されたdatetimeに基づいて、指定された分周期の最も近い値に切り上げた後の時間値を返します。戻り値の精度は、入力パラメータdatetimeの精度と同じです。

- 入力がTIMESTAMPTZ型の場合、最初にlocal_timeに変換され（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表す）、その後MINUTE_CEIL計算を実行します。
- 入力時間値（`<date_or_time_expr>`と`<period>`）にTIMESTAMPTZ型とDATETIME型の両方が含まれている場合、出力はDATETIME型になります。
- `<period>`が非正数（≤0）の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが指定されていない場合、デフォルトで1分間隔になります。
- `<origin>`が指定されていない場合、デフォルトで0001-01-01 00:00:00がベースラインになります。
- 入力がDATE型（年、月、日のみを含む）の場合、その時間部分はデフォルトで00:00:00になります。
- 計算結果が最大datetime 9999-12-31 23:59:59を超える場合、エラーを返します。
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、周期kは負の値になります。
- `date_or_time_expr`にスケールがある場合、返される結果にもスケールが含まれ、小数部分はゼロになります。

## Examples

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:29:00 |
+---------------------+

-- Using five minutes as one period, rounding up with default origin point
SELECT MINUTE_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_CEIL('2023-07-13 22:30:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+-----------------------------------------------------------+
| minute_ceil("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+-----------------------------------------------------------+
| 2023-07-13 22:28:23                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_CEIL('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_CEIL('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:35:00 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_CEIL('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_CEIL
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 03:00:00+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MINUTE_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 03:00:00.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns error
SELECT MINUTE_CEIL('9999-12-31 23:59:18', 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 9999-12-31 23:59:18, 6 out of range

-- Period is non-positive, returns error
SELECT MINUTE_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_CEIL(NULL, 5), MINUTE_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| minute_ceil(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
