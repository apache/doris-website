---
{
    "title": "SECOND_FLOOR",
    "language": "ja",
    "description": "SECOND_FLOOR は、DATE、DATETIME、TIMESTAMP_NS、または TIMESTAMPTZ 型の値を、指定した秒数の周期の開始時点に切り下げます。"
}
---

## 説明

SECOND_FLOOR は、`DATE`、`DATETIME`、`TIMESTAMP_NS`、または `TIMESTAMPTZ` 型の値を、指定した秒数の周期の開始時点に切り下げます。origin を指定した場合は、その時刻を基準にします。指定しない場合、基準時刻は 0001-01-01 00:00:00 です。

日付の計算式：
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの期間数を表します。

## 構文

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## パラメータ

| パラメータ | 説明 |
| --------- | ----------- |
| `<datetime>` | 必須。入力する日時値です。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応します。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各期間を構成する秒数です。正の整数型（INT）に対応します。デフォルトは 1 秒です。 |
| `<origin_datetime>` | 省略可能。期間をそろえる基準時刻です。`DATE`、`DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型に対応します。省略した場合は 0001-01-01T00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度である `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されたデフォルトの基準時刻は内部的な位置合わせの基準としてのみ使用され、`TIMESTAMP_NS` 型で格納可能な範囲内である必要はありません。

TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE 型の値を返します。戻り値は、入力日時を指定した秒数の周期の開始時点に切り下げた結果です。戻り値の精度は入力日時パラメータの精度と一致します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから SECOND_FLOOR を計算します（例：`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します。これはセッション変数が `+08:00` の場合です）。
- 入力する時刻値（`<datetime>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- `<period>` が非正（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- period を指定しない場合、デフォルトは 1 秒の期間です。
- `<origin_datetime>` を指定しない場合、0001-01-01 00:00:00 を基準にします。
- 入力が DATE 型（年、月、日のみを含む）の場合、時刻部分のデフォルトは 00:00:00 です。
- 小数秒精度を持つ datetime の場合、小数部のすべての桁が 0 に切り捨てられます。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、期間数 k は負になります。

## 例

```sql
-- Default period of 1 second, default starting time 0001-01-01 00:00:00
SELECT SECOND_FLOOR('2025-01-23 12:34:56') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 5-second period, downward rounding result with default starting point
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:55 |
+---------------------+

-- Only with origin date and specified date
select second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123");
+----------------------------------------------------------------+
| second_floor("2023-07-13 22:28:18", "2023-07-13 22:13:12.123") |
+----------------------------------------------------------------+
| 2023-07-13 22:28:17.123                                        |
+----------------------------------------------------------------+

-- Specify starting time (origin)
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2025-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT SECOND_FLOOR('2025-01-23 12:34:56', 10, '2029-01-23 12:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:50 |
+---------------------+

-- Datetime with microseconds, decimal places truncated to 0 after rounding
SELECT SECOND_FLOOR('2025-01-23 12:34:56.789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2025-01-23 12:34:55.000000 |
+----------------------------+

-- Input is DATE type (default time 00:00:00)
SELECT SECOND_FLOOR('2025-01-23', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform SECOND_FLOOR
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-01-01 02:59:00+08:00                 |
+-------------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| SECOND_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-01-01 02:59:00.123                                              |
+----------------------------------------------------------------------+

-- Period is non-positive, returns error
mysql> SELECT SECOND_FLOOR('2025-01-23 12:34:56', -3) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation second_floor of 2025-01-23 12:34:56, -3 out of range

-- Any parameter is NULL, returns NULL
SELECT SECOND_FLOOR(NULL, 5), SECOND_FLOOR('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| second_floor(NULL, 5)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+
```
