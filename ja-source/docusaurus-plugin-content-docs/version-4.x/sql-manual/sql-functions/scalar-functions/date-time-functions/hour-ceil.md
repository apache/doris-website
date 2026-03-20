---
{
  "title": "HOUR_CEIL",
  "description": "hourceil関数は、入力されたdatetime値を指定された時間間隔の最も近い時刻に切り上げます。例えば、間隔が5時間の場合、",
  "language": "ja"
}
---
## 説明

hour_ceil関数は、入力されたdatetime値を指定された時間周期の最も近い時刻に切り上げます。例えば、周期が5時間の場合、この関数は入力時刻をその周期内の次の時刻マークに調整します。

日付計算式：
$$
\begin{aligned}
&\text{hour\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から目標時刻に到達するために必要な周期数を表します。

## 構文

```sql
HOUR_CEIL(`<date_or_time_expr>`)
HOUR_CEIL(`<date_or_time_expr>`, `<origin>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<date_or_time_expr>` | datetime型とdate型をサポートする有効な日付式。date型は00:00:00の一日の開始時刻に変換されます。具体的なdatetime/date形式については、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)と[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<period>` | 期間の長さを指定するオプションパラメータ（単位：時間）。正の整数である必要があります（1、3、5など）。デフォルト値は1で、1時間ごとに1つの期間を表します |
| `<origin>` | 開始時刻の基準点。datetime型とdate型をサポートします。指定されない場合、デフォルトは0001-01-01T00:00:00です |

## Return Value

切り上げ後の最も近い期間時刻を表すDATETIME型の値を返します。

- 入力期間が非正の整数の場合、エラーを返します。
- いずれかのパラメータがNULLの場合、結果はNULLを返します。
- originまたはdatetimeにスケールがある場合、返される結果にはスケールがあります。
- 計算結果が最大datetime範囲9999-12-31 23:59:59を超える場合、エラーを返します。
- `<origin>`の日時が`<period>`より後の場合でも、上記の式に従って計算されますが、期間kは負の値になります。


## Examples

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
