---
{
  "title": "QUARTER_FLOOR",
  "description": "QUARTERFLOOR関数は、入力されたdatetime値を、指定された四半期期間の最も近い値に切り捨てます。origin timeを指定した場合、",
  "language": "ja"
}
---
## 説明

QUARTER_FLOOR関数は、入力されたdatetime値を指定された四半期期間の最も近い値に切り捨てます。起点時刻を指定した場合、この時刻を基準として期間が分割され切り捨てられます。指定されない場合、デフォルトは0001-01-01 00:00:00です。この関数はDATETIME型とDATE型をサポートします。

日付と時刻の計算式：

$$
\begin{aligned}
&\text{quarter\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から対象時刻までの期間数を表します

## 構文

```sql
QUARTER_FLOOR(`<date_or_time_expr>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<origin>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| Parameter | デスクリプション |
| ---- | ---- |
| `<date_or_time_expr>` | 切り捨て対象となる日時値、型はDATETIMEまたはDATE。具体的な日時/日付フォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照 |
| `<period>` | 四半期期間値、型はINT、各期間に含まれる四半期数を示す |
| `<origin_datetime>` | 期間の開始時点、型はDATETIME/DATE、デフォルトは0001-01-01 00:00:00 |

## 戻り値

戻り値の型はDATETIMEで、入力された日時に基づいて、指定された四半期期間の最も近い境界に切り捨てられた時刻値を返します。戻り値の精度は入力パラメータdatetimeの精度と同じです。

- `<period>`が非正値（≤0）の場合、エラーが返されます。
- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが指定されていない場合、デフォルトで1四半期が期間となります。
- `<origin>`が指定されていない場合、デフォルトで0001-01-01 00:00:00が基準となります。
- 入力がDATE型（年、月、日のみを含む）の場合、その時刻部分はデフォルトで00:00:00となります。
- `<origin>`の日時が`<period>`より後の場合も、上記の数式に従って計算されますが、期間kは負の値となります。
- `date_or_time_expr`にscaleがある場合、戻り値もscaleを持ち、小数部分はゼロとなります。

## 説明

quarter_floor関数は、日時値を指定された四半期期間境界の最も近い値に切り捨てます。originが指定された場合、その時刻を基準として期間が計算されます。

日付計算式：
$$
\begin{aligned}
&\text{quarter\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は、基準時刻から目標時刻に到達するために必要な期間数を表します。

## 構文

```sql
QUARTER_CEIL(`<date_or_time_expr>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<origin>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| Parameter | デスクリプション |
| ---- | ---- |
| `<date_or_time_expr>` | 切り上げされるdatetime値です。date/datetimeタイプをサポートする有効な日付式です。具体的なdatetimeおよびdate形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 四半期期間値、タイプINT、各期間に含まれる四半期数を示します |
| `<origin_datetime>` | 期間の開始時点、date/datetimeタイプをサポート、デフォルト値は0001-01-01 00:00:00です |

注意:
- periodが指定されていない場合、1四半期を期間として使用するのと同等です
- periodが正の整数でない場合、関数の結果はNULLになります
- 結果は常に過去の時間に丸められます
- 戻り値の時刻部分は常に00:00:00です

## 戻り値

`<datetime>`がDATEタイプの場合、戻り値のタイプはDATEです。
`<datetime>`がDATETIMEタイプの場合、戻り値のタイプはDATETIMEです。
結果の時刻部分は00:00:00に設定されます。

## 例

```sql
-- Default period of 1 quarter, default start time 0001-01-01 00:00:00
SELECT QUARTER_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- With 5 quarters as one period, rounding down result with default starting point
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Input datetime is exactly the period starting point, return the input datetime
SELECT QUARTER_FLOOR('2023-07-01 00:00:00', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Only start date and specified date
select QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00");
+-------------------------------------------------------------+
| QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00") |
+-------------------------------------------------------------+
| 2023-07-01 00:00:00                                         |
+-------------------------------------------------------------+

-- Specify origin time
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 2, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- Datetime with scale, all decimal places will be truncated to 0
SELECT QUARTER_FLOOR('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-01 00:00:00.000000 |
+----------------------------+

--- If <origin> datetime is after <period>, it will also be calculated according to the above formula, but period k is negative
SELECT QUARTER_FLOOR('2022-09-13 22:28:18', 4, '2028-07-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2020-07-01 00:00:00 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT QUARTER_FLOOR('2023-07-13', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- Period is non-positive, returns error
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_floor of 2023-07-13 22:28:18, -1 out of range

--- Any parameter is NULL, returns NULL
SELECT QUARTER_FLOOR(NULL, 1), QUARTER_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| quarter_floor(NULL, 1) | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
## ベストプラクティス

[date_floor](./date-floor)も参照してください
