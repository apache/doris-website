---
{
  "title": "HOUR_FLOOR",
  "language": "ja",
  "description": "HOUR_FLOOR関数は、入力されたdatetime値を指定された時間周期の最も近い時点まで切り捨てます。例えば、周期が5時間の場合、この関数は入力時刻をその周期内の開始時刻マークに調整します。"
}
---
## 説明

HOUR_FLOOR関数は、入力された日時値を指定された時間間隔の最も近い時刻に切り下げます。例えば、間隔が5時間の場合、関数は入力時刻をその間隔内の開始時刻マークに調整します。

日付計算式：
$$
\begin{aligned}
&\text{hour\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から対象時刻までの間隔数を表します。

## 構文

```sql
HOUR_FLOOR(`<date_or_time_expr>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<origin>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/timestamptz型をサポートする有効な日付式。Date型は対応する日付の開始時刻00:00:00に変換されます。具体的なフォーマットについては[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)を、datetime/dateフォーマットについては[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)および[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | 期間の長さを指定するオプションパラメータ（単位：時間）。正の整数である必要があります（2、6、12など）。デフォルト値は1で、1時間ごとに1つの期間を表します |
| `<origin>` | 開始時刻の基準点。datetime/date型をサポートします。指定されない場合、デフォルトは0001-01-01T00:00:00です |

## 戻り値

切り捨て後の最も近い期間の瞬間を表すTIMESTAMPTZ、DTすまたはDATE型の値を返します。

- 入力がTIMESTAMPTZ型の場合、まずlocal_timeに変換され（例：`2025-12-31 23:59:59+05:00`はセッション変数が`+08:00`の場合、local_time `2026-01-01 02:59:59`を表します）、その後FLOOR計算を実行します。
- 入力時刻値（`<date_or_time_expr>`および`<period>`）にTIMESTAMPTZ型とDATETIME型の両方が含まれる場合、出力はDATETIME型になります。
- 入力期間が非正整数の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、結果はNULLを返します。
- originまたはdatetimeにスケールがある場合、返される結果にもスケールが含まれます。
- `<origin>`の日時が`<period>`より後の場合でも、上記の式に従って計算されますが、期間kは負の値になります。

## 例

```sql

-- Round down by 5-hour period, default origin is 0001-01-01 00:00:00
mysql> select hour_floor("2023-07-13 22:28:18", 5);
+--------------------------------------+
| hour_floor("2023-07-13 22:28:18", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Using 2023-07-13 08:00 as origin, divide by 4-hour periods
mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+---------------------+
| custom_origin       |
+---------------------+
| 2023-07-13 16:00:00 |
+---------------------+

-- Input datetime exactly at period edge, return input datetime value
select hour_floor("2023-07-13 18:00:00", 5);
+--------------------------------------+
| hour_floor("2023-07-13 18:00:00", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Only with origin date and specified date
select hour_floor("2023-07-13 22:28:18", "2023-07-01 12:12:00");
+----------------------------------------------------------+
| hour_floor("2023-07-13 22:28:18", "2023-07-01 12:12:00") |
+----------------------------------------------------------+
| 2023-07-13 22:12:00                                      |
+----------------------------------------------------------+

-- Input date type will be converted to start time 2023-07-13 00:00:00 of the day
mysql> select hour_floor('2023-07-13 20:30:00', 4, '2023-07-13');
+----------------------------------------------------+
| hour_floor('2023-07-13 20:30:00', 4, '2023-07-13') |
+----------------------------------------------------+
| 2023-07-13 20:00:00                                |
+----------------------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform HOUR_FLOOR
SELECT HOUR_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| HOUR_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-01-01 02:00:00                     |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT HOUR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| HOUR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-01 02:00:00.123                                            |
+--------------------------------------------------------------------+

-- If origin or datetime has scale, the returned result has scale
mysql> select hour_floor('2023-07-13 19:30:00.123', 4, '2023-07-03 08:00:00') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.000 |
+-------------------------+

mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-03 08:00:00.123') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.123 |
+-------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select hour_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') ;
+-----------------------------------------------------------------+
| hour_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+-----------------------------------------------------------------+
| 2023-07-13 16:00:00.000                                         |
+-----------------------------------------------------------------+

-- Input any parameter as NULL (returns NULL)
mysql> select hour_floor(null, 6) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Period is negative, returns erro
mysql> select hour_floor('2023-12-31 23:59:59', -3);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation hour_floor of 2023-12-31 23:59:59, -3 out of range

```
