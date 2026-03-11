---
{
  "title": "WEEK_FLOOR | 日付時刻関数",
  "sidebar_label": "WEEK_FLOOR",
  "description": "WEEKFLOOR関数は、入力されたdatetime値を、指定された週間隔の開始時刻のうち最も近いものに切り下げます。間隔の単位はWEEKです。",
  "language": "ja"
}
---
# WEEK_FLOOR

## 説明

WEEK_FLOOR関数は、入力されたdatetime値を指定された週間隔の開始時刻に切り下げます。間隔の単位はWEEKです。開始基準点（origin）が指定されている場合、その点を間隔計算の基準として使用します。そうでない場合は、デフォルトで0000-01-01 00:00:00を基準点として使用します。

日付計算式：
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$は基準時刻から対象時刻までの期間数を表します。

## 構文

```sql
WEEK_FLOOR(`<date_or_time_expr>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<origin>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り捨てを行う日時値。date/datetimeタイプをサポートします。datetimeおよびdateフォーマットについては、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | 週間隔値。INTタイプで、各間隔の週数を表します |
| `<origin>` | 間隔の開始点。date/datetimeタイプをサポートします。デフォルトは0000-01-01 00:00:00です |

## 戻り値

DATETIMEタイプを返し、切り捨てられた日時値を表します。結果の時刻部分は00:00:00に設定されます。

- `<period>`が非正数（≤0）の場合、関数はエラーを返します
- いずれかのパラメータがNULLの場合、NULLを返します
- `<datetime>`が間隔の開始点（`<period>`と`<origin>`に基づく）と完全に一致する場合、その開始点を返します
- 入力がdateタイプの場合、dateタイプを返します
- 入力がdatetimeタイプの場合、元の時刻と同じ時刻部分を持つdatetimeタイプを返します
- `<origin>`の日時が`<period>`より後の場合でも、上記の式に従って計算されますが、期間kは負の値になります
- date_or_time_exprにスケールがある場合、返される結果もスケールを持ち、小数部分はゼロになります

## 例

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- input with decimal part
mysql> SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+

-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

-- Only with origin date and specified date
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+

-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Invalid period, returns error
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
RROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range

-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
