---
{
    "title": "DATE_CEIL",
    "language": "ja",
    "description": "dateceil 関数は、指定した日付または時刻の値を、指定した時間間隔の開始時点まで切り上げます。"
}
---

## 説明


date_ceil 関数は、指定した日付または時刻の値を、指定した時間間隔の開始時点まで切り上げます。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型の入力をサポートします。間隔は period（単位の数）と type（単位）で定義され、固定の起点 0001-01-01 00:00:00 から計算されます。

日付の計算式：
$$
\begin{aligned}
&\text{date\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な周期数を表します。

$type$ は間隔の単位を表します。

## 構文

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `date_or_time_expr` | 有効な日付式。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートします。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `period` | 各間隔を構成する単位の数を指定します。型は INT です。起点は 0001-01-01T00:00:00 です。 |
| `type` | 指定可能な値：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定で九桁の `TIMESTAMP_NS` 型を返します。結果は戻り値の型がサポートする範囲に照らして検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を `TIMESTAMP_NS` 型の入力で省略した場合、文書に記載されたデフォルトの起点は内部で位置合わせに使用する基準にすぎず、`TIMESTAMP_NS` 型で格納可能な範囲に含まれている必要はありません。

戻り値の型は TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、DATE のいずれかです。入力値を指定した単位に切り上げた結果を表す日付または時刻の値を返します。

切り上げた結果は `<date_or_time_expr>` の型に応じた値になります：
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換します（例えば、`2025-12-31 23:59:59+05:00` は local_time `2026-01-01 02:59:59` に相当します。この例ではセッション変数を `+08:00` に設定しています）。その後、DATE_CEIL の計算を行います。
- 入力が DATE 型の場合、DATE 型（日付部分のみ）を返します。
- 入力が DATETIME 型の場合、DATETIME 型（日付と時刻を含む）を返します。
- 入力が TIMESTAMP_NS 型の場合、小数秒が九桁の TIMESTAMP_NS 型を返します。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型（日付、時刻、オフセットを含む）を返します。
- DATETIME 型と TIMESTAMPTZ 型の入力に scale がある場合、戻り値にも scale があり、小数部分はゼロになります。

特殊なケース：
- いずれかの引数が NULL の場合、NULL を返します。
- 切り上げた結果が日付型でサポートされる範囲を超える場合（例えば、'9999-12-31 23:59:59' より後になる場合）、エラーを返します。
- period 引数が正の整数でない場合、エラーが発生します。

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
