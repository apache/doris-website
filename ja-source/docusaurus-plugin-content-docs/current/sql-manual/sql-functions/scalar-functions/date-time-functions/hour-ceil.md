---
{
  "title": "HOUR_CEIL",
  "language": "ja",
  "description": "HOUR_CEIL関数は、入力されたdatetime値を指定された時間期間の最も近い時刻に切り上げます。例えば、期間が5時間の場合、この関数は入力時刻をその期間内の次の時刻マークに調整します。"
}
---
## 説明

HOUR_CEIL関数は、入力されたdatetime値を指定された時間周期の最も近い時刻まで切り上げます。例えば、周期が5時間の場合、この関数は入力時刻をその周期内の次の時刻マークに調整します。

日付計算公式：
$$
\begin{aligned}
&\text{hour\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は、基準時刻から対象時刻に到達するために必要な周期数を表します。

## 構文

```sql
HOUR_CEIL(`<date_or_time_expr>`)
HOUR_CEIL(`<date_or_time_expr>`, `<origin>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/timestamptz型をサポートする有効な日付式。Date型は1日の開始時刻00:00:00に変換されます。具体的な形式については[timestamptz的转换](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を参照し、datetime/date形式については[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | 期間の長さを指定するオプションパラメータ（単位：時間）。正の整数である必要があります（1、3、5など）。デフォルト値は1で、1時間ごとに1期間を表します |
| `<origin>` | 開始時刻の起点で、datetimeおよびdate型をサポートします。指定されない場合、デフォルトは0001-01-01T00:00:00です |

## 戻り値

切り上げ後の最も近い期間の瞬間を表すTIMESTAMPTZ、DTあるいはDATE型の値を返します。

- 入力がTIMESTAMPTZ型の場合、まずlocal_time に変換され（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表します）、その後CEIL計算を実行します。
- 入力時刻値（`<date_or_time_expr>`と`<period>`）にTIMESTAMPTZとDATETIME型の両方が含まれる場合、出力はDATETIME型になります。
- 入力期間が非正の整数の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、結果はNULLを返します。
- originまたはdatetimeにscaleがある場合、返される結果にはscaleがあります。
- 計算結果が最大datetime範囲9999-12-31 23:59:59を超える場合、エラーを返します。
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、期間kは負の値になります。


## 例

```sql

-- Round up with a 5-hour period
mysql> select hour_ceil("2023-07-13 22:28:18", 5);
+-------------------------------------+
| hour_ceil("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-13 23:00:00                 |
+-------------------------------------+

-- Using 2023-07-13 08:00 as the origin, divide by 4-hour periods
mysql> select hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+----------------------------+
| custom_origin              |
+----------------------------+
| 2023-07-13 20:00:00        |
+----------------------------+

-- Input date type will be converted to the start time 00:00:00 of the corresponding date
mysql> select hour_ceil('2023-07-13 00:30:00', 6, '2023-07-13');
+---------------------------------------------------+
| hour_ceil('2023-07-13 00:30:00', 6, '2023-07-13') |
+---------------------------------------------------+
| 2023-07-13 06:00:00                               |
+---------------------------------------------------+

-- If exactly at the edge of a period, return the input datetime
select hour_ceil('2023-07-13 01:00:00');
+----------------------------------+
| hour_ceil('2023-07-13 01:00:00') |
+----------------------------------+
| 2023-07-13 01:00:00              |
+----------------------------------+

--  Only with origin date and specified date
select hour_ceil("2023-07-13 22:28:18", "2023-07-01 12:12:00");
+---------------------------------------------------------+
| hour_ceil("2023-07-13 22:28:18", "2023-07-01 12:12:00") |
+---------------------------------------------------------+
| 2023-07-13 23:12:00                                     |
+---------------------------------------------------------+

-- If origin or datetime has scale, the returned result has scale
mysql> select hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00.123') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00.123') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.123                                        |
+----------------------------------------------------------------+

mysql> select hour_ceil('2023-07-13 19:30:00.123', 4, '2023-07-13 08:00:00') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00.123', 4, '2023-07-13 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.000                                        |
+----------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select hour_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') ;
+----------------------------------------------------------------+
| hour_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 20:00:00.000                                        |
+----------------------------------------------------------------+

-- If calculation result exceeds maximum datetime range 9999-12-31 23:59:59, return error
select hour_ceil("9999-12-31 22:28:18", 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_ceil of 9999-12-31 22:28:18, 6 out of range

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform HOUR_CEIL
SELECT HOUR_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| HOUR_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-01 03:00:00                    |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT HOUR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| HOUR_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-01 03:00:00.123                                           |
+-------------------------------------------------------------------+

-- If period is less than or equal to 0, return error
mysql> select hour_ceil("2023-07-13 22:28:18", 0);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_ceil of 2023-07-13 22:28:18, 0 out of range

-- If any input parameter is NULL, return NULL
mysql> select hour_ceil(null, 3) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

mysql> select hour_ceil("2023-07-13 22:28:18", NULL);
+----------------------------------------+
| hour_ceil("2023-07-13 22:28:18", NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

mysql> select hour_ceil("2023-07-13 22:28:18", 5,NULL);
+------------------------------------------+
| hour_ceil("2023-07-13 22:28:18", 5,NULL) |
+------------------------------------------+
| NULL                                     |
+------------------------------------------+
```
