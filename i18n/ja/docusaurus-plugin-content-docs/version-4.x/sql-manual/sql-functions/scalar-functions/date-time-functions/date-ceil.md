---
{
    "title": "DATE_CEIL",
    "language": "ja",
    "description": "dateceil 関数は、指定した日付または時刻の値を、指定した時間間隔の直近の開始時点まで切り上げます。"
}
---

## 説明


date_ceil 関数は、指定した日付または時刻の値を、指定した時間間隔の直近の開始時点まで切り上げます。間隔は period（単位数）と type（単位）で定義され、固定の起点 0001-01-01 00:00:00 から計算されます。

日付の計算式：
$$
\begin{aligned}
&\text{date\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な周期数を表します。

$type$ は period の単位を表します。

## 構文

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `date_or_time_expr` | 有効な日付式。DATE、DATETIME、TIMESTAMPTZ 型の入力をサポートします。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `period` | 各間隔を構成する単位数を指定します。型は INT です。起点は 0001-01-01T00:00:00 です。 |
| `type` | YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND のいずれかを指定できます。 |

## 戻り値

戻り値の型は TIMESTAMPTZ、DATETIME、DATE のいずれかです。入力値を指定した単位で切り上げた日付または時刻の値を返します。

`<date_or_time_expr>` の型に応じた切り上げ結果を返します：
- 入力が TIMESTAMPTZ 型の場合、最初に local_time に変換してから DATE_CEIL を計算します（たとえば、`2025-12-31 23:59:59+05:00` が local_time `2026-01-01 02:59:59` を表すのは、セッション変数が `+08:00` の場合です）。
- 入力が DATE 型の場合、DATE 型（日付部分のみ）を返します。
- 入力が DATETIME 型の場合、DATETIME 型（日付と時刻を含む）を返します。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型（日付、時刻、オフセットを含む）を返します。
- 小数秒の精度が指定された DATETIME 型および TIMESTAMPTZ 型では、戻り値も同じ精度を持ち、小数部分はゼロになります。

特殊なケース：
- いずれかのパラメータが NULL の場合、NULL を返します。
- 切り上げ結果が日付型でサポートされる範囲を超える場合（たとえば '9999-12-31 23:59:59' より後になる場合）、エラーを返します。
- period パラメータが正でない整数の場合、エラーが発生します。

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
