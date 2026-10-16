---
{
    "title": "MINUTE_FLOOR",
    "language": "ja",
    "description": "MINUTE_FLOOR は DATE、DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ の値を、指定した分単位の期間の直前の境界に切り下げます。"
}
---

## 説明

MINUTE_FLOOR は `DATE`、`DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` の値を、指定した分単位の期間の直前の境界に切り下げます。origin を指定した場合はそれを基準点として使用し、省略した場合は 0001-01-01 00:00:00 を基準点とします。

日時の計算式：
$$
\begin{aligned}
&\text{minute\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの期間数を表します。

## 構文

```sql
MINUTE_FLOOR(`<datetime>`)
MINUTE_FLOOR(`<datetime>`, `<origin>`)
MINUTE_FLOOR(`<datetime>`, `<period>`)
MINUTE_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## 引数

| 引数 | 説明 |
| --------- | ----------- |
| `<datetime>` | 切り下げる日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型を指定できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各期間に含まれる分数を表す INT 型の値。 |
| `<origin>` | 省略可能。期間の開始基準となる時点。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型を指定できます。デフォルト値は 0001-01-01 00:00:00 です。 |

## 戻り値

入力が `TIMESTAMP_NS` の場合は、小数秒部分が固定の九桁である `TIMESTAMP_NS` を返します。結果は戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 入力では、記載されているデフォルトの基準点は内部での期間の位置合わせにのみ使用されるため、`TIMESTAMP_NS` の格納可能範囲内にある必要はありません。

戻り値の型は TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE です。入力日時を指定した分単位の期間の直前の境界に切り下げた時刻を返します。戻り値の精度は入力引数の日時と同じです。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから MINUTE_FLOOR を計算します。たとえば、`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します（セッション変数が `+08:00` の場合）。
- 入力時刻の値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- `<period>` が正の数でない場合（≤0）は、エラーを返します。
- いずれかの引数が NULL の場合は、NULL を返します。
- period を指定しない場合、デフォルトは 1 分間隔です。
- `<origin>` を指定しない場合、基準点のデフォルトは 0001-01-01 00:00:00 です。
- 入力が DATE 型の場合（年、月、日のみを含む）、時刻部分のデフォルトは 00:00:00 です。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。ただし、期間数 $k$ は負になります。
- `date_or_time_expr` に小数秒の桁数がある場合、戻り値も同じ桁数を持ち、小数秒部分はゼロになります。

## 例

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:00 |
+---------------------+

-- Using five minutes as one period, rounding down with default origin point
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_FLOOR('2023-07-13 22:25:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23");
+------------------------------------------------------------+
| minute_floor("2023-07-13 22:28:18", "2023-07-01 12:21:23") |
+------------------------------------------------------------+
| 2023-07-13 22:27:23                                        |
+------------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:25:00 |
+---------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_FLOOR('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform MINUTE_FLOOR
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| MINUTE_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_FLOOR('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:30:00 |
+---------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_FLOOR(NULL, 5), MINUTE_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| minute_floor(NULL, 5)  | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
