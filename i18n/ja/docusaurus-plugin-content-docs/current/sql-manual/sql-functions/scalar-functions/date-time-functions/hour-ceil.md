---
{
    "title": "HOUR_CEIL",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型の値を、指定した時間間隔の直近の境界まで切り上げます。"
}
---

## 説明


HOUR_CEIL 関数は、入力した日時を、指定した時間間隔の直近の境界まで切り上げます。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型の入力をサポートします。たとえば間隔を 5 時間に指定すると、入力した日時をその間隔における次の時刻の境界に合わせます。

日時の計算式：
$$
\begin{aligned}
&\text{hour\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでの周期数を表します。

## 構文

```sql
HOUR_CEIL(`<date_or_time_expr>`)
HOUR_CEIL(`<date_or_time_expr>`, `<origin>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`)
HOUR_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメーター

| パラメーター | 説明 |
| -- | -- |
| `<date_or_time_expr>` | `DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートする有効な日付式。`DATE` 型の入力は、その日の開始時刻 00:00:00 として扱われます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。間隔の長さを時間単位で指定します。正の整数（1、3、5 など）である必要があります。デフォルトは 1 で、1 時間ごとに境界が設定されます。 |
| `<origin>` | 省略可能。起点となる日時です。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートします。省略した場合のデフォルトは 0001-01-01T00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度の `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されているデフォルトの起点は内部的な位置合わせの基準としてのみ使用され、`TIMESTAMP_NS` に格納可能な範囲内である必要はありません。

指定した間隔の境界まで切り上げた時点を表す、TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、DATE のいずれかの型の値を返します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換し（たとえば `2025-12-31 23:59:59+05:00` は local_time で `2026-01-01 02:59:59` を表します。これはセッション変数が `+08:00` の場合です）、その後 CEIL の計算を行います。
- 入力時刻の値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。
- 入力した期間が正の整数でない場合は、エラーを返します。
- いずれかの引数が NULL の場合は、NULL を返します。
- 起点または入力日時に小数秒の精度がある場合、戻り値もその精度を持ちます。
- 計算結果が日時の最大値 9999-12-31 23:59:59 を超える場合は、エラーを返します。
- 起点 <origin> の日時が <period> より後であっても、上記の式に従って計算します。この場合、周期数 $k$ は負になります。


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
