---
{
    "title": "SECOND_CEIL",
    "language": "ja",
    "description": "SECOND_CEIL 関数は、入力された日時値を指定した秒間隔の境界まで切り上げます。origin を指定した場合はそれを基準とし、指定しない場合は 0001-01-01 00:00:00 を基準とします。DATETIME 型を処理できます。"
}
---

## 説明


SECOND_CEIL 関数は、入力された日時値を指定した秒間隔の境界まで切り上げます。origin を指定した場合はそれを基準とし、指定しない場合は 0001-01-01 00:00:00 を基準とします。この関数は DATETIME 型を処理できます。

日時の計算式：
$$
\begin{aligned}
&\text{second\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な周期数を表します。

## 構文

```sql
SECOND_CEIL(<datetime>[, <period>][, <origin_datetime>])
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 必須。入力する日時値です。DATE、DATETIME、TIMESTAMPTZ 型を指定できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各周期を構成する秒数です。正の整数型（INT）を指定できます。デフォルトは 1 秒です。 |
| `<origin_datetime>` | 省略可能。区切りの基準となる開始時刻です。DATETIME 型、または DATETIME 形式に適合する文字列を指定できます。省略した場合、デフォルトは 0001-01-01T00:00:00 です。 |

## 戻り値

TIMESTAMPTZ、DATETIME、または DATE 型の値を返します。入力した日時を、指定した秒間隔の境界まで切り上げた時刻です。戻り値の精度は、入力した日時パラメータの精度と一致します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから SECOND_CEIL を計算します。たとえば、`2025-12-31 23:59:59+05:00` の local_time は `2026-01-01 02:59:59` です（セッション変数が `+08:00` の場合）。
- 入力する時刻値（`<datetime>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。
- `<period>` が正でない整数（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- period を省略した場合、デフォルトの周期は 1 秒です。
- `<origin>` を省略した場合、デフォルトの基準は 0001-01-01 00:00:00 です。
- 入力が DATE 型（年月日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- 計算結果が DATETIME 型の有効範囲（0000-01-01 00:00:00 から 9999-12-31 23:59:59.999999）を超える場合、エラーを返します。
- 小数秒を持つ日時では、小数部のすべての桁が切り上げ後に 0 になります。
- `<origin>` の日時が `<period>` より後の場合も、上記の式に従って計算されますが、周期数 k は負になります。

## 例

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_CEIL('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, upward rounding result with default starting point
SELECT SECOND_CEIL('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Only with origin date and specified date
select second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+---------------------------------------------------------------+
| second_ceil("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+---------------------------------------------------------------+
| 2023-07-13 22:28:18.123                                       |
+---------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_CEIL('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:00 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_CEIL('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:35:00.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_CEIL('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_CEIL
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 02:59:59+08:00                |
+------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| SECOND_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2026-01-01 02:59:59.123                                             |
+---------------------------------------------------------------------+

-- Calculation result exceeds maximum datetime range, returns error
SELECT SECOND_CEIL('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 9999-12-31 23:59:59, 2 out of range

-- Period is non-positive, returns error
mysql> SELECT SECOND_CEIL('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_ceil of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_CEIL(NULL, 5), SECOND_CEIL('2025-01-23 12:34:56', NULL) AS result;
+------------------------+--------+
| second_ceil(NULL, 5)   | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
