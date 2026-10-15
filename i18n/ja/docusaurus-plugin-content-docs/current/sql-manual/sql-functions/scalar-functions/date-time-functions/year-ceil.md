---
{
    "title": "YEAR_CEIL",
    "language": "ja",
    "description": "yearceil 関数は、入力された日時を、年単位で指定された間隔の開始時刻に切り上げます。"
}
---

## 説明


year_ceil 関数は、入力された日時を、年単位で指定された間隔の開始時刻に切り上げます。origin を指定した場合はその日時を基準とし、省略した場合は 0000-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\begin{aligned}
&\text{year\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な期間の数を表します。

## 構文
```sql
YEAR_CEIL(<date_or_time_expr>)
YEAR_CEIL(<date_or_time_expr>, origin)
YEAR_CEIL(<date_or_time_expr>, <period>)
YEAR_CEIL(<date_or_time_expr>, <period>, <origin>)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り上げ対象の日時値です。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能です。各期間を構成する年数を表し、正の整数（INT）を指定できます。デフォルトは 1 年です。 |
| `<origin_datetime>` | 期間の起点です。DATE、DATETIME、TIMESTAMP_NS 型をサポートします。デフォルトは 0000-01-01 00:00:00 です。 |

## 戻り値

入力が `TIMESTAMP_NS` の場合は、小数秒が常に九桁の `TIMESTAMP_NS` を返します。結果は戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されているデフォルトの起点は内部で間隔を揃えるための基準としてのみ使用され、`TIMESTAMP_NS` で格納可能な範囲内にある必要はありません。

入力の型（TIMESTAMP_NS、DATETIME、DATE）に応じた結果を返します。結果は、切り上げ後の年単位の期間の開始時刻を表します。

- 入力が DATE 型の場合は、日付部分のみを含む DATE 型を返します。入力が DATETIME 型または正しい形式の文字列の場合は、DATETIME 型を返します。時刻部分は起点と一致し、起点を省略した場合は 00:00:00 になります。
- `<period>` が正でない整数（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<date_or_time_expr>` が `<period>` と `<origin>` に基づく期間の開始点と完全に一致する場合、その開始点を返します。
- 計算結果が日時の最大値 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日時が `<period>` より後にある場合も、上記の式に従って計算します。このとき、期間数 $k$ は負の値になります。
- date_or_time_expr に小数秒の桁数がある場合、戻り値も同じ桁数を持ち、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合は、まずローカル時刻に変換してから CEIL を計算します。たとえば、`2025-12-31 23:59:59+05:00` は、ローカル時刻 `2026-01-01 02:59:59` を表します（セッション変数が `+08:00` の場合）。
- 入力の時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

## 例

```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds up to 2024-01-01
SELECT YEAR_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds up to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-01 00:00:00 |  
+---------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_CEIL(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2024-01-01 |
+------------+

-- Only with origin date and specified date
select year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+---------------------------------------------------------+
| year_ceil("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+---------------------------------------------------------+
| 2024-03-13 22:13:00                                     |
+---------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2024-01-01
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- input with scale
mysql> SELECT YEAR_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2026-01-01 00:00:00.000 |
+-------------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_CEIL('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_CEIL('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_CEIL
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2027-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2027-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Calculation result exceeds maximum datetime, returns error
SELECT YEAR_CEIL('9999-12-31 22:28:18', 5) AS result;
-- ERROR: Operation out of range
```
