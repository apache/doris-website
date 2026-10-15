---
{
    "title": "MINUTE_CEIL",
    "language": "ja",
    "description": "MINUTE_CEIL は、DATE、DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ の値を、指定した分単位の区間境界に切り上げます。"
}
---

## 説明


MINUTE_CEIL は、`DATE`、`DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` の値を、指定した分単位の区間境界に切り上げます。origin を指定した場合はそれを基準とし、省略した場合は 0001-01-01 00:00:00 を基準とします。

日時の計算式：
$$
\begin{aligned}
&\text{minute\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでの区間数を表します。

## 構文

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<date_or_time_expr>` | 切り上げる日時の値。DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型を指定できます。各型の形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 分単位の区間を表す INT 型の値。各区間に含まれる分数を指定します。 |
| `<origin>` | 区間の開始基準となる時刻。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型を指定できます。デフォルト値は 0001-01-01 00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数部が常に九桁の `TIMESTAMP_NS` 型を返します。結果が戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されているデフォルトの基準時刻は内部的な区間の整列にのみ使用されるため、`TIMESTAMP_NS` 型で格納可能な範囲内にある必要はありません。

TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE 型の値を返します。入力日時を基に、指定した分単位の区間境界に切り上げた時刻を返します。戻り値の精度は、入力日時パラメータの精度と同じです。

- 入力が TIMESTAMPTZ 型の場合、最初に local_time へ変換してから MINUTE_CEIL を計算します。たとえば、`2025-12-31 23:59:59+05:00` は local_time では `2026-01-01 02:59:59` になります（セッション変数が `+08:00` の場合）。
- 入力の時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- `<period>` が 0 以下の場合はエラーを返します。
- いずれかのパラメータが NULL の場合は NULL を返します。
- period を省略した場合、デフォルトで 1 分間隔になります。
- `<origin>` を省略した場合、基準時刻はデフォルトの 0001-01-01 00:00:00 になります。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 計算結果が日時の上限である 9999-12-31 23:59:59 を超える場合はエラーを返します。
- `<origin>` の日時が `<period>` より後の場合も上記の式に従って計算されますが、区間数 k は負になります。
- `date_or_time_expr` に小数秒の桁数がある場合、戻り値も同じ桁数を持ち、小数部分はゼロになります。

## 例

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
