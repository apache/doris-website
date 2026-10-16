---
{
    "title": "YEAR_FLOOR",
    "language": "ja",
    "description": "YEAR_FLOOR 関数は、入力された日時の値を、指定した年単位の区間で最も近い開始時刻まで切り下げます。origin を指定した場合は、その値を基準とします。"
}
---

## 説明

YEAR_FLOOR 関数は、入力された日時の値を、指定した年単位の区間で最も近い開始時刻まで切り下げます。origin を指定した場合はその値を基準とし、指定しない場合は 0000-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\begin{aligned}
&\text{year\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの区間数を表します。

## 構文
```sql
YEAR_FLOOR(<date_or_time_expr>)
YEAR_FLOOR(<date_or_time_expr>, origin)
YEAR_FLOOR(<date_or_time_expr>, <period>)
YEAR_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## パラメータ
| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り下げる日時の値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型をサポートします。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各区間を構成する年数を表します。正の整数型（INT）をサポートし、デフォルトは 1 年です。 |
| `<origin_datetime>` | 区間の開始基準点。DATE、DATETIME、TIMESTAMP_NS 型をサポートし、デフォルトは 0000-01-01 00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度を持つ `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲に収まるか検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されているデフォルトの基準点は内部で区間を揃えるためだけに使用され、保存可能な `TIMESTAMP_NS` 型の範囲内にある必要はありません。
入力の型（TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、DATE）に対応する型で、切り下げ後の年単位の区間の開始時刻を返します。

- 入力が DATE 型の場合、日付部分のみを含む DATE 型を返します。入力が DATETIME 型または適切な形式の文字列の場合、DATETIME 型を返します。時刻部分は origin と一致し、origin がない場合はデフォルトの 00:00:00 になります。
- `<period>` が正でない整数（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<date_or_time_expr>` が `<period>` と `<origin>` に基づく区間の開始点と正確に一致する場合、その開始点を返します。
- 計算結果が日時の最大値 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、区間数 $k$ は負になります。
- date_or_time_expr に小数秒の精度がある場合、戻り値も同じ精度を持ち、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから FLOOR 計算を行います。たとえば、`2025-12-31 23:59:59+05:00` は local_time では `2026-01-01 02:59:59` を表します。この場合、セッション変数は `+08:00` です。
- 入力の時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

## 例
```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds down to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds down to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-01-01 00:00:00 |  
+---------------------+

-- input with scale
mysql> SELECT YEAR_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2021-01-01 00:00:00.000 |
+-------------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-01-01 |
+------------+

-- Only with origin date and specified date
select year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+----------------------------------------------------------+
| year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+----------------------------------------------------------+
| 2023-03-13 22:13:00                                      |
+----------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_FLOOR('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Input time earlier than origin start time, rounds down to earlier interval point
SELECT YEAR_FLOOR('2019-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-01 00:00:00 |
+---------------------+

-- Cross-multiple periods rounding down, period=3, origin='2020-01-01'
SELECT YEAR_FLOOR('2025-07-13', 3, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_FLOOR('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input time part earlier than origin time part, rounds down within same year
SELECT YEAR_FLOOR('2023-07-13 06:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-01-01 08:30:00 |
+---------------------+

-- Input time part later than origin time part, normal rounding down
SELECT YEAR_FLOOR('2023-07-13 10:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_FLOOR
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2026-01-01 00:00:00+08:00               |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_FLOOR('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_floor of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
