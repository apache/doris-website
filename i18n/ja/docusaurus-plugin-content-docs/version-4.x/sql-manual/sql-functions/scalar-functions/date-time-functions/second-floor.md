---
{
    "title": "SECOND_FLOOR",
    "language": "ja",
    "description": "SECOND_FLOOR 関数は、入力された日時を指定した秒数の間隔に従って切り下げます。起点を指定した場合はそれを基準とし、指定しない場合は 0001-01-01 00:00:00 を基準とします。DATETIME 型を処理できます。"
}
---

## 説明

SECOND_FLOOR 関数は、入力された日時を指定した秒数の間隔に従って切り下げます。起点を指定した場合はそれを基準とし、指定しない場合は 0001-01-01 00:00:00 を基準とします。この関数は DATETIME 型を処理できます。

日時の計算式：
$$
\begin{aligned}
&\text{second\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{second} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻までの間隔の数を表します。

## 構文

```sql
SECOND_FLOOR(<datetime>[, <period>][, <origin_datetime>])
```

## パラメータ

| パラメータ | 説明 |
| --------- | ---- |
| `<datetime>` | 必須。入力する日時の値。DATE、DATETIME、TIMESTAMPTZ 型の入力をサポートします。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 省略可能。各間隔を構成する秒数を指定します。正の整数型（INT）をサポートします。デフォルトは 1 秒です。 |
| `<origin_datetime>` | 省略可能。間隔を揃える際の起点です。DATETIME 型の値、および DATETIME 形式に合致する文字列をサポートします。省略した場合、デフォルトは 0001-01-01T00:00:00 です。 |

## 戻り値

TIMESTAMPTZ、DATETIME、または DATE 型の値を返します。入力日時を基準として、指定した秒数の間隔に従って切り下げた日時を返します。戻り値の精度は、入力日時パラメータの精度と一致します。

- 入力が TIMESTAMPTZ 型の場合、まずローカル時刻に変換してから SECOND_FLOOR を計算します（たとえば、`2025-12-31 23:59:59+05:00` は、ローカル時刻 `2026-01-01 02:59:59` を表します。これはセッション変数が `+08:00` の場合です）。
- 入力値（`<datetime>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。
- `<period>` が正の値でない場合（≤ 0）、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- 間隔を指定しない場合、デフォルトで 1 秒の間隔を使用します。
- `<origin_datetime>` を指定しない場合、デフォルトで 0001-01-01 00:00:00 を基準とします。
- 入力が DATE 型（年、月、日のみ）の場合、時刻部分のデフォルトは 00:00:00 です。
- 小数秒の精度を持つ日時では、小数部分のすべての桁が 0 に切り下げられます。
- `<origin>` の日時が `<period>` より後の場合も、上記の式に従って計算されますが、間隔数 k は負になります。

## 使用例

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
