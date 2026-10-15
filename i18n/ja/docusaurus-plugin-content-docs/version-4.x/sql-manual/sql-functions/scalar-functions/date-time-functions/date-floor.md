---
{
    "title": "DATE_FLOOR",
    "language": "ja",
    "description": "DATE_FLOOR 関数は、指定した日付または時刻を、指定した時間間隔の開始時点まで切り下げます。"
}
---

## 説明

DATE_FLOOR 関数は、指定した日付または時刻を、指定した時間間隔の開始時点まで切り下げます。間隔は period（単位の数）と type（単位）で定義し、固定の起点である 0001-01-01 00:00:00 から計算します。

日付の計算式：
$$
\begin{aligned}
&\text{date\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{type}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{type} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでの周期数を表します。

$type$ は間隔の単位を表します。

## 構文

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `date_or_time_expr` | 有効な日付式。DATE、DATETIME、TIMESTAMPTZ 型を入力できます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `period` | 各間隔を構成する単位の数を指定する `INT` 型の値。起点は 0001-01-01T00:00:00 です。 |
| `type` | YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND のいずれかを指定します。 |

## 戻り値

戻り値の型は TIMESTAMPTZ、DATETIME、または DATE です。指定した間隔に従って日付を切り下げた結果を、`<date_or_time_expr>` と同じ型で返します。

`<date_or_time_expr>` の型に応じて、次の結果を返します。
- 入力が TIMESTAMPTZ 型の場合、まずローカル時刻に変換してから DATE_FLOOR の計算を行います。たとえば、`2025-12-31 23:59:59+05:00` はローカル時刻 `2026-01-01 02:59:59` に相当します（セッション変数が `+08:00` の場合）。
- 入力が DATE 型の場合、DATE 型（日付部分のみ）を返します。
- 入力が DATETIME 型の場合、DATETIME 型（日付と時刻を含む）を返します。
- 入力が TIMESTAMPTZ 型の場合、TIMESTAMPTZ 型（日付、時刻、オフセットを含む）を返します。
- 入力に小数秒の精度がある場合、戻り値もその精度を保持し、小数部分はゼロになります。

特別な場合：
- いずれかのパラメータが NULL の場合、NULL を返します。
- period が不正な場合（正の整数でない場合）、または type が不正な場合、エラーを返します。

## 例

```sql
-- Floor down to the nearest 5-second interval (period starts at 00, 05, 10... seconds)
mysql> select date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND);
+------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND) |
+------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                             |
+------------------------------------------------------------------------+

-- Date time with scale will return value with scale
mysql> select date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND);
+----------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND) |
+----------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                                 |
+----------------------------------------------------------------------------+

-- The input time is exactly the start of a 5-day period
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

-- Floor down for date type
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

-- TimeStampTz type example, SET time_zone = '+08:00'
-- Convert variable value to local_time(2026-01-01 02:59:59) then perform DATE_FLOOR operation
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR);
+----------------------------------------------------------+
| DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 YEAR) |
+----------------------------------------------------------+
| 2026-01-01 00:00:00+08:00                                |
+----------------------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DATE_FLOOR('2025-12-31 23:59:59+05:00', INTERVAL 1 HOUR, '2025-12-15 00:00:00.123') AS result;

-- period is negative, invalid returns error
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5, 0001-01-01 00:00:00 out of range

-- Unsupported type
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

-- Any parameter is NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- Floor down every 5 weeks
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

```
