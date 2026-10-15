---
{
    "title": "HOUR_FLOOR",
    "language": "ja",
    "description": "HOUR_FLOOR 関数は、入力した日時を、指定した時間間隔の境界のうち入力日時以前で最も近い時刻に切り下げます。たとえば間隔が 5 時間の場合、入力時刻をその間隔の開始時刻に調整します。"
}
---

## 説明 {#description}

HOUR_FLOOR 関数は、入力した日時を、指定した時間間隔の境界のうち入力日時以前で最も近い時刻に切り下げます。たとえば間隔が 5 時間の場合、入力時刻をその間隔の開始時刻に調整します。

日時の計算式:
$$
\begin{aligned}
&\text{hour\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの時間間隔の数を表します。

## 構文 {#syntax}

```sql
HOUR_FLOOR(`<date_or_time_expr>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<origin>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | datetime/date/timestamptz 型に対応する有効な日付式。date 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 時間間隔の長さを指定する省略可能なパラメータ（単位: 時間）。2、6、12 などの正の整数である必要があります。デフォルト値は 1 で、1 時間ごとに区切ります。 |
| `<origin>` | 間隔の基準となる開始時刻を指定する省略可能なパラメータ。datetime/date 型に対応します。省略した場合のデフォルト値は 0001-01-01T00:00:00 です。 |

## 戻り値 {#return-value}

切り下げ後の直前の間隔境界を表す TIMESTAMPTZ、DATETIME、または DATE 型の値を返します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから FLOOR 計算を行います。たとえば、`2025-12-31 23:59:59+05:00` は local_time `2026-01-01 02:59:59` に相当します（セッション変数が `+08:00` の場合）。
- 入力の時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。
- 入力の時間間隔が正でない整数の場合はエラーを返します。
- いずれかのパラメータが NULL の場合は NULL を返します。
- 基準時刻または日時に小数秒の精度がある場合、戻り値にも小数秒の精度が含まれます。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、間隔数 k は負になります。

## 例 {#examples}

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
