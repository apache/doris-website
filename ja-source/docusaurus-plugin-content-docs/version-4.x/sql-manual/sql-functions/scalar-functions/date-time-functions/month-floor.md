---
{
  "title": "MONTH_FLOOR",
  "description": "monthfloor関数は、入力されたdatetime値を指定された月間隔の最も近い値に切り下げます。originが指定されている場合、",
  "language": "ja"
}
---
## 説明

month_floor関数は、入力されたdatetime値を指定された月間隔の最も近い値に切り下げます。originが指定された場合、それをベースラインとして使用します。指定されない場合は、デフォルトで0001-01-01 00:00:00になります。

日付計算式:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$はベースライン時刻からターゲット時刻までの期間数を表します。

## 構文

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<datetime>` | 切り捨てる対象のdatetime値で、DATETIMEおよびDATE型です。具体的なdatetimeフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 月間隔値で、INT型です。各間隔に含まれる月数を表します。 |
| `<origin>` | 間隔の開始時点で、DATETIMEおよびDATE型です。デフォルト値は0001-01-01 00:00:00です。 |

## 戻り値

DATETIME型の値を返します。これは、入力されたdatetimeに基づいて、指定された月間隔の最も近い値に切り捨てた後の時間値を表します。結果の時間コンポーネントは00:00:00に設定され、日コンポーネントは01に切り詰められます。

- `<period>`が非正数（≤0）の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが指定されていない場合、デフォルトで1か月間隔になります。
- `<origin>`が指定されていない場合、デフォルトで0001-01-01 00:00:00がベースラインになります。
- 入力がDATE型（年、月、日のみを含む）の場合、その時間部分はデフォルトで00:00:00になります。
- `<origin>`の日時が`<period>`より後の場合でも、上記の数式に従って計算されますが、期間kは負の値になります。
- date_or_time_exprにスケールがある場合、返される結果にもスケールがあり、小数部分はゼロになります。

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
