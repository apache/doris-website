---
{
  "title": "WEEK_FLOOR",
  "language": "ja",
  "description": "WEEKFLOOR関数は、入力されたdatetime値を、指定された週間隔の開始時刻のうち最も近いものに切り捨てる関数で、間隔の単位はWEEKです。"
}
---
## 説明

WEEK_FLOOR関数は、入力されたdatetime値を最も近い指定された週間隔の開始時刻に切り下げます。間隔の単位はWEEKです。開始基準点（origin）が指定されている場合は、その点を間隔計算の基準として使用します。指定されていない場合は、デフォルトで0000-01-01 00:00:00を基準点として使用します。

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
| `<date_or_time_expr>` | 切り下げる日時値。date/datetime/timestamptz型をサポート。date型は対応する日付の開始時刻00:00:00に変換されます。具体的な形式については[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を、datetime/date形式については[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | 週間隔値、INT型、各間隔の週数を表します |
| `<origin>` | 間隔の開始点、date/datetime型をサポート。デフォルトは0000-01-01 00:00:00です |

## 戻り値

DATETIME型を返し、切り下げられた日時値を表します。結果の時刻部分は00:00:00に設定されます。

- `<period>`が非正数（≤0）の場合、関数はエラーを返します
- いずれかのパラメータがNULLの場合、NULLを返します
- `<datetime>`が間隔の開始点（`<period>`と`<origin>`に基づく）と正確に一致する場合、その開始点を返します
- 入力がdate型の場合、date型を返します
- 入力がdatetime型の場合、originの時刻と同じ時刻部分を持つdatetime型を返します
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、期間kは負の値になります
- date_or_time_exprにスケールがある場合、返される結果もスケールを持ち、小数部分はゼロになります
- 入力がTIMESTAMPTZ型の場合、まずlocal_time（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表します）に変換され、その後FLOOR計算が実行されます
- 入力時刻値（`<date_or_time_expr>`と`<period>`）にTIMESTAMPTZとDATETIME型の両方が含まれる場合、出力はDATETIME型になります

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

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_FLOOR
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2025-12-29 00:00:00+08:00               |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2025-12-29 00:00:00.123                                            |
+--------------------------------------------------------------------+

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
