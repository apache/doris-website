---
{
    "title": "WEEK_FLOOR",
    "language": "ja",
    "description": "WEEKFLOOR 関数は、入力した日時を、WEEK を単位とする指定された週数の間隔で直近の開始時刻に切り下げます。"
}
---

## 説明

WEEK_FLOOR 関数は、入力した日時を、WEEK を単位とする指定された週数の間隔で直近の開始時刻に切り下げます。基準となる開始時刻（origin）を指定した場合は、その時刻を基準に間隔を計算します。指定しない場合は、0000-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ は、基準時刻から対象時刻までの間隔の数を表します。

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
| `<date_or_time_expr>` | 切り下げる日時値。DATE、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ 型に対応しています。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 週単位の間隔。型は INT で、各間隔に含まれる週数を表します。 |
| `<origin>` | 間隔の開始基準点。DATE、DATETIME、TIMESTAMP_NS 型に対応します。省略時は 0000-01-01 00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が常に九桁の `TIMESTAMP_NS` 型を返します。結果は戻り値の型の有効範囲に照らして検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、上記のデフォルトの基準時刻は内部で間隔をそろえるためだけに使われるため、`TIMESTAMP_NS` 型で格納できる範囲内にある必要はありません。

入力引数から決まる日時型で、切り下げ後の日時値を返します。結果の時刻部分は origin の時刻に設定されます。

- `<period>` が正の値でない（≤0）場合は、エラーを返します。
- いずれかの引数が NULL の場合は、NULL を返します。
- `<datetime>` が（`<period>` と `<origin>` に基づく）間隔の開始点と完全に一致する場合は、その開始点を返します。
- 入力が DATE 型の場合は、DATE 型を返します。
- 入力が DATETIME 型の場合は、origin と同じ時刻部分を持つ DATETIME 型を返します。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、間隔を表す k は負になります。
- date_or_time_expr に小数秒の桁数がある場合は、戻り値にも同じ桁数があり、小数部分はゼロになります。
- 入力が TIMESTAMPTZ 型の場合は、最初に local_time に変換してから FLOOR を計算します。たとえば、`2025-12-31 23:59:59+05:00` は現地時刻 `2026-01-01 02:59:59` を表します（セッション変数が `+08:00` の場合）。
- 入力値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

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
