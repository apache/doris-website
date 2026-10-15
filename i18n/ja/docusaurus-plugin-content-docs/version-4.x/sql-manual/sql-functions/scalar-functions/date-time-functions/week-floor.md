---
{
    "title": "WEEK_FLOOR",
    "language": "ja",
    "description": "WEEKFLOOR 関数は、入力された日時値を、WEEK を単位とする指定された週の間隔の開始時刻まで切り下げます。"
}
---

## 説明

WEEK_FLOOR 関数は、入力された日時値を、WEEK を単位とする指定された週の間隔の開始時刻まで切り下げます。開始基準点（origin）を指定した場合は、その点を基準に間隔を計算します。指定しない場合は、0000-01-01 00:00:00 を基準点とします。

日時の計算式：
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ は、基準時刻から対象時刻までの周期数を表します。

## 構文

```sql
WEEK_FLOOR(`<date_or_time_expr>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<origin>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り下げる日時値です。DATE、DATETIME、TIMESTAMPTZ 型を指定できます。DATE 型は、その日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。|
| `<period>` | 省略可能。週単位の間隔値です。型は INT で、各間隔に含まれる週数を表します。 |
| `<origin>` | 省略可能。間隔の開始基準点です。DATE、DATETIME 型を指定できます。デフォルトは 0000-01-01 00:00:00 です。 |

## 戻り値

DATETIME 型の値を返し、切り下げ後の日時を表します。結果の時刻部分は 00:00:00 に設定されます。

- `<period>` が正でない値（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が間隔の開始点（`<period>` と `<origin>` に基づく）と完全に一致する場合、その開始点を返します。
- 入力が DATE 型の場合、DATE 型を返します。
- 入力が DATETIME 型の場合、origin の時刻部分と同じ時刻部分を持つ DATETIME 型を返します。
- `<origin>` の日時が `<period>` より後の場合も、上記の式に従って計算されますが、周期数 k は負になります。
- date_or_time_expr に小数秒の精度がある場合、戻り値も同じ精度を持ち、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換し（たとえば、`2025-12-31 23:59:59+05:00` は、local_time では `2026-01-01 02:59:59` を表します。これは、セッション変数が `+08:00` の場合です）、その後 FLOOR を計算します。
- 入力する時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。

## 例

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- input with decimal part
mysql> SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+

-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

-- Only with origin date and specified date
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+

-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_FLOOR
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00');
+-----------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2025-12-29 00:00:00+08:00               |
+-----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2025-12-29 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Invalid period, returns error
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range

-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
