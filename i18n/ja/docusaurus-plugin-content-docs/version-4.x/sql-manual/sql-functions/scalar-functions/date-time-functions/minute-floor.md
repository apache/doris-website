---
{
    "title": "MINUTE_FLOOR",
    "language": "ja",
    "description": "MINUTE_FLOOR 関数は、入力された日時値を指定した分単位の間隔で切り下げます。origin を指定した場合はその日時を基準とし、省略した場合は 0001-01-01 00:00:00 を基準とします。DATETIME 型の処理をサポートします。"
}
---

## 説明

MINUTE_FLOOR 関数は、入力された日時値を指定した分単位の間隔で切り下げます。origin を指定した場合はその日時を基準とし、省略した場合は 0001-01-01 00:00:00 を基準とします。この関数は DATETIME 型の処理をサポートします。

日時の計算式:
$$
\begin{aligned}
&\text{minute\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの間隔の数を表します。

## 構文

```sql
MINUTE_FLOOR(`<datetime>`)
MINUTE_FLOOR(`<datetime>`, `<origin>`)
MINUTE_FLOOR(`<datetime>`, `<period>`)
MINUTE_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 切り下げる日時値。DATE、DATETIME、TIMESTAMPTZ 型を入力できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 各間隔に含まれる分数を表す INT 型の値。 |
| `<origin>` | 間隔の基点となる DATETIME 型の日時。デフォルト値は 0001-01-01 00:00:00 です。 |

## 戻り値

TIMESTAMPTZ、DATETIME、または DATE 型の値を返します。入力された日時を指定した分単位の間隔で切り下げた時刻を返します。戻り値の精度は入力パラメータ datetime の精度と同じです。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから MINUTE_FLOOR を計算します（例: `2025-12-31 23:59:59+05:00` は、local_time の `2026-01-01 02:59:59` を表します。この例ではセッション変数は `+08:00` です）。
- 入力値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- `<period>` が正の数でない場合（≤0）はエラーを返します。
- いずれかのパラメータが NULL の場合は NULL を返します。
- period を省略した場合、デフォルトは 1 分間隔です。
- `<origin>` を省略した場合、デフォルトでは 0001-01-01 00:00:00 を基準とします。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分のデフォルトは 00:00:00 です。
- `<origin>` の日時が `<period>` より後の場合でも、上記の式に従って計算されますが、間隔の数 k は負になります。
- `date_or_time_expr` に小数秒の桁数がある場合、戻り値もその桁数を持ち、小数部分はゼロになります。

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
