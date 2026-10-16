---
{
    "title": "HOUR_FLOOR",
    "language": "ja",
    "description": "DATE、DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ の値を、指定した時間間隔の直前の境界まで切り下げます。"
}
---

## 説明

HOUR_FLOOR 関数は、入力した日時の値を、指定した時間間隔の直前の境界まで切り下げます。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` の入力に対応します。たとえば、間隔が 5 時間の場合、入力時刻をその間隔の開始時刻に調整します。

日時の計算式：
$$
\begin{aligned}
&\text{hour\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{hour} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの間隔の数を表します。

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
| `<date_or_time_expr>` | `DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` に対応する有効な日付式。`DATE` の入力は、その日の開始時刻である 00:00:00 として扱われます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 間隔の長さを時間単位で指定する省略可能なパラメータ。正の整数（2、6、12 など）である必要があります。デフォルト値は 1 で、1 時間ごとの間隔を表します。 |
| `<origin>` | 省略可能な、開始時刻となる基準点。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` に対応します。省略した場合のデフォルト値は 0001-01-01T00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` の入力に対しては、小数秒の精度が固定の九桁である `TIMESTAMP_NS` を返します。結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 入力では、記載されているデフォルトの基準点は内部の位置合わせにのみ使用され、`TIMESTAMP_NS` で格納できる範囲内にある必要はありません。

切り下げ後の直前の間隔の境界時刻を表す TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE 型の値を返します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから FLOOR を計算します（たとえば、`2025-12-31 23:59:59+05:00` は local_time で `2026-01-01 02:59:59` を表します。この例のセッション変数は `+08:00` です）。
- 入力時刻の値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- 入力の間隔が正でない整数の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、結果は NULL になります。
- 基準点または日時に小数秒の桁がある場合、戻り値にも小数秒の桁があります。
- `<origin>` の日時が `<period>` より後である場合も、上記の式に従って計算されますが、間隔の数 k は負になります。

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
