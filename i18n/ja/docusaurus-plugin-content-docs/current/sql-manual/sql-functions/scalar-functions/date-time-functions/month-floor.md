---
{
    "title": "MONTH_FLOOR",
    "language": "ja",
    "description": "MONTH_FLOOR 関数は、入力された日時を指定した月間隔で切り下げます。起点を指定した場合は、その起点を基準にします。"
}
---

## 説明

month_floor 関数は、入力された日時を指定した月間隔で切り下げます。origin を指定した場合はそれを基準とし、省略した場合は 0001-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの期間数を表します。

## 構文

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<datetime>` | 切り下げの対象となる日時値。DATETIME/DATE/TIMESTAMP_NS/TIMESTAMPTZ 型をサポートします。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 月単位の間隔を表す INT 型の値。各間隔に含まれる月数を指定します。 |
| `<origin>` | 間隔の起点となる日時。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` をサポートします。デフォルト値は 0001-01-01 00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` を入力すると、小数秒の精度が九桁に固定された `TIMESTAMP_NS` が返されます。結果が戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 入力の場合、文書に記載されたデフォルトの起点は内部での位置合わせにのみ使用されます。この起点が `TIMESTAMP_NS` で格納可能な範囲内にある必要はありません。

入力引数に基づいて選択された日時型で、指定された月間隔に切り下げた時刻値を返します。時刻部分は 00:00:00 に、日部分は 01 に設定されます。

- `<period>` が正でない値（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- period を指定しない場合、デフォルトは 1 か月です。
- `<origin>` を指定しない場合、0001-01-01 00:00:00 を基準とします。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分はデフォルトで 00:00:00 になります。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、期間数 $k$ は負になります。
- date_or_time_expr に小数秒の精度がある場合、戻り値にもその精度が維持され、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから FLOOR を計算します（例：`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します。このとき、セッション変数は `+08:00` です）。
- 入力値（`<datetime>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型です。

## 例

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding down with default origin point
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Only with origin date and specified date
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-05-01 00:00:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing the FLOOR operation
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

-- Period is non-positive, returns error
SELECT MONTH_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation month_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
