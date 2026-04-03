---
{
  "title": "YEAR_CEIL",
  "language": "ja",
  "description": "yearceil関数は、入力されたdatetime値を、指定された年間隔の開始時刻まで切り上げる関数で、間隔単位は年です。"
}
---
## 説明


year_ceil関数は、入力されたdatetime値を指定された年間隔の開始時刻まで切り上げます。間隔の単位は年です。originが指定されている場合はそれを基準として使用し、そうでなければデフォルトで0000-01-01 00:00:00を使用します。

日付計算式:
$$
\begin{aligned}
&\text{year\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から対象時刻に到達するために必要な期間数を表します。

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
| `<date_or_time_expr>` | 切り上げる日時値。date/datetime/timestamptz型をサポートします。date型は対応する日付の開始時刻00:00:00に変換されます。具体的な形式については[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | オプション。各期間が何秒で構成されるかを表し、正の整数型(INT)をサポートします。デフォルトは1秒です。 |
| `<origin_datetime>` | 間隔の開始点。date/datetime型をサポートします。デフォルトは0000-01-01 00:00:00です。 |

## 戻り値

入力型と一致する結果（DATETIMEまたはDATE）を返し、切り上げ後の年間隔開始時刻を表します：

- 入力がDATE型の場合、DATE型を返します（日付部分のみを含む）。入力がDATETIMEまたは適切にフォーマットされた文字列の場合、DATETIME型を返します（時刻部分はoriginと一致し、originがない場合はデフォルトで00:00:00）。
- `<period>`が非正の整数（≤0）の場合、関数はエラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- `<date_or_time_expr>`が間隔の開始点（`<period>`と`<origin>`に基づく）と正確に一致する場合、その開始点を返します。
- 計算結果が最大datetime 9999-12-31 23:59:59を超える場合、エラーを返します。
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、期間kは負の値になります。
- date_or_time_exprにscaleがある場合、返される結果にもscaleがあり、小数部分はゼロになります。
- 入力がTIMESTAMPTZ型の場合、まずlocal_timeに変換され（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表します）、その後CEIL計算を実行します。
- 入力時刻値（`<date_or_time_expr>`と`<period>`）にTIMESTAMPTZ型とDATETIME型の両方が含まれる場合、出力はDATETIME型になります。

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
+---------------------------------------+
| YEAR_CEIL('2025-12-31 23:59:59+05:00')|
+---------------------------------------+
| 2027-01-01 00:00:00+08:00             |
+---------------------------------------+

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
