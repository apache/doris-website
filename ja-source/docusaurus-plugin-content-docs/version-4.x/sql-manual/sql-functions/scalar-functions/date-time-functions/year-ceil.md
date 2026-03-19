---
{
  "title": "YEAR_CEIL",
  "description": "yearceil関数は、入力されたdatetime値を、指定された年間隔の開始時刻のうち最も近い値に切り上げます。間隔の単位は年です。",
  "language": "ja"
}
---
## デスクリプション

year_ceil関数は、入力されたdatetime値を指定された年間隔の開始時刻に切り上げる関数で、間隔単位は年です。originが指定されている場合はそれを基準として使用し、そうでなければデフォルトで0000-01-01 00:00:00を使用します。

日付計算式:
$$
\begin{aligned}
&\text{year\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から対象時刻に到達するために必要な期間数を表します。

## Syntax

```sql
YEAR_CEIL(<date_or_time_expr>)
YEAR_CEIL(<date_or_time_expr>, origin)
YEAR_CEIL(<date_or_time_expr>, <period>)
YEAR_CEIL(<date_or_time_expr>, <period>, <origin>)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<date_or_time_expr>` | 切り上げ対象のdatetime値。date/datetimeタイプをサポートします。datetimeとdateの形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | オプション。各期間が何秒で構成されるかを表します。正の整数タイプ（INT）をサポートします。デフォルトは1秒です。 |
| `<origin_datetime>` | 間隔の開始点。date/datetimeタイプをサポートします。デフォルトは0000-01-01 00:00:00です。 |

## 戻り値

入力タイプと一致する結果（DATETIMEまたはDATE）を返します。切り上げ後の年間隔開始時刻を表します：

- 入力がDATEタイプの場合、DATEタイプを返します（日付部分のみを含む）。入力がDATETIMEまたは適切にフォーマットされた文字列の場合、DATETIMEタイプを返します（時刻部分はoriginと一致し、originがない場合のデフォルトは00:00:00）。
- `<period>`が非正の整数（≤0）の場合、関数はエラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- `<date_or_time_expr>`が間隔の開始点と正確に一致する場合（`<period>`と`<origin>`に基づく）、その開始点を返します。
- 計算結果がdatetimeの最大値9999-12-31 23:59:59を超える場合、エラーを返します。
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、期間kは負の値になります。
- date_or_time_exprがスケールを持つ場合、返される結果もスケールを持ち、小数部分はゼロになります。

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
