---
{
  "title": "DATE_CEIL",
  "language": "ja",
  "description": "dateceil関数は、指定された日付または時刻の値を、指定された時間間隔期間の最も近い開始時点まで切り上げます。"
}
---
## 説明

date_ceil関数は、指定された日付または時刻値を、指定された時間間隔周期の最も近い開始点まで切り上げます。周期ルールは、period（単位数）とtype（単位）によって定義され、固定開始点0001-01-01 00:00:00から計算されます。

日付計算式：
$$
\begin{aligned}
&\text{date\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は、基準時刻が目標時刻に到達するために必要な周期数を表します。

$type$は、periodの単位を表します

## 構文

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `date_or_time_expr` | 有効な日付式で、date/datetime/timestamptz型の入力をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `period` | 各周期を構成する単位数を指定し、INT型です。開始時点は0001-01-01T00:00:00です |
| `type` | 次の値が可能です：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND |

## 戻り値

戻り値の型はTIMESTAMPTZ、DATETIME、またはDATEです。入力値を指定された単位まで切り上げた結果を表す日付または時刻値を返します。

`<date_or_time_expr>`型と一致する丸め結果を返します：
- 入力がTIMESTAMPTZ型の場合、最初にlocal_time（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表します）に変換され、その後DATE_CEIL計算が実行されます。
- 入力がDATEの場合、DATE（日付部分のみ）を返します；
- 入力がDATETIMEの場合、DATETIME（日付と時刻を含む）を返します。
- 入力がTIMESTAMPTZ型の場合、TIMESTAMPTZ（日付、時刻、オフセットを含む）を返します。
- scaleを持つDATETIMEおよびTIMESTAMPTZの場合、戻り値にもscaleが含まれ、小数部分はゼロになります。

特殊な場合：
- いずれかのパラメータがNULLの場合、NULLを返します；
- 丸め結果が日付型でサポートされる範囲を超える場合（例：'9999-12-31 23:59:59'以降）、エラーを返します；
- periodパラメータが非正の整数の場合、エラーをスローします。

## 例

```sql
-- Round up seconds to the nearest 5-second interval
mysql> select date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second);

+------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second) |
+------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000000                                             |
+------------------------------------------------------------------------+

-- Date time parameter with scale
mysql> select date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second);
+-----------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second) |
+-----------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000                                                     |
+-----------------------------------------------------------------------------+

-- Round up to the nearest 5-minute interval
select date_ceil("2023-07-13 22:28:18",interval 5 minute);
+--------------------------------------------------------------+
| minute_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+

-- Round up to the nearest 5-week interval
select date_ceil("2023-07-13 22:28:18",interval 5 WEEK);
+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 WEEK) |
+--------------------------------------------------+
| 2023-08-14 00:00:00                              |
+--------------------------------------------------+

-- Round up to the nearest 5-hour interval
select date_ceil("2023-07-13 22:28:18",interval 5 hour);

+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 hour) |
+--------------------------------------------------+
| 2023-07-13 23:00:00                   |
+--------------------------------------------------+

-- Round up to the nearest 5-day interval
select date_ceil("2023-07-13 22:28:18",interval 5 day);

+-----------------------------------------------------------+
| day_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-----------------------------------------------------------+
| 2023-07-15 00:00:00                                       |
+-----------------------------------------------------------+

-- Round up to the nearest 5-month interval
select date_ceil("2023-07-13 22:28:18",interval 5 month);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+


-- Round up to the nearest 5-year interval
select date_ceil("2023-07-13 22:28:18",interval 5 year);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+

-- TimeStampTz type example, SET time_zone = '+08:00'
-- Convert variable value to local_time(2026-01-01 02:59:59) then perform DATE_CEIL operation
SELECT DATE_CEIL('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR);
+---------------------------------------------------------+
| DATE_CEIL('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR) |
+---------------------------------------------------------+
| 2027-01-01 00:00:00+08:00                               |
+---------------------------------------------------------+

-- Exceeds the maximum year
mysql> select date_ceil("9999-07-13",interval 5 year);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 9999-07-13 00:00:00, 5 out of range

-- Any parameter is NULL
mysql> select date_ceil("9900-07-13",interval NULL year);
+--------------------------------------------+
| date_ceil("9900-07-13",interval NULL year) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+

mysql> select date_ceil(NULL,interval 5 year);
+---------------------------------+
| date_ceil(NULL,interval 5 year) |
+---------------------------------+
| NULL                            |
+---------------------------------+

-- Invalid parameter, period is negative
mysql> select date_ceil("2023-01-13 22:28:18",interval -5 month);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation month_ceil of 2023-01-13 22:28:18, -5, 0001-01-01 00:00:00 out of range
```
