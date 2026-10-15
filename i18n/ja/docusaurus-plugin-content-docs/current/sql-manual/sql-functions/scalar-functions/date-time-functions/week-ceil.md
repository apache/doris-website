---
{
    "title": "WEEK_CEIL",
    "language": "ja",
    "description": "weekceil 関数は、入力された日時値を、指定した週数間隔の直近の開始時刻へ切り上げます。origin を指定した場合、"
}
---

## 説明


week_ceil 関数は、入力された日時値を、指定した週数間隔の直近の開始時刻へ切り上げます。origin を指定した場合はそれを基準時刻として使用し、省略した場合は 0000-01-01 00:00:00 を使用します。

日付の計算式：
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に達するまでに必要な期間数を表します。

## 構文

```sql
WEEK_CEIL(`<date_or_time_expr>`)
WEEK_CEIL(`<date_or_time_expr>`, `<origin>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## パラメータ

| パラメータ | 説明 |
|-----------|------|
| `<date_or_time_expr>` | 切り上げる日時値。DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型に対応します。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については [TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を参照してください。DATETIME/DATE の形式については、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) と [DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。 |
| `<period>` | 省略可。週の間隔を表す INT 型の値。各間隔の週数を指定します。 |
| `<origin>` | 省略可。間隔の起点。DATE/DATETIME/TIMESTAMP_NS 型に対応します。デフォルトは 0000-01-01 00:00:00 です。 |

## 戻り値

`TIMESTAMP_NS` 型の入力は、秒の小数部が固定の九桁精度である `TIMESTAMP_NS` 型の値を返します。結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、文書に記載されたデフォルトの起点は内部的な間隔の基準としてのみ使用され、`TIMESTAMP_NS` 型で格納可能な範囲内にある必要はありません。

入力引数に応じて選択された日時型で、切り上げ後の日時値を返します。

- `<period>` が正でない整数（≤0）の場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が間隔の開始時点（`<period>` と `<origin>` に基づく）と完全に一致する場合、その開始時点を返します。
- 入力が DATE 型の場合、DATE 型を返します。
- 入力が DATETIME 型の場合、時刻部分が起点の時刻と同じ DATETIME 型の値を返します。
- 計算結果が日時の最大値 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、期間数 k は負の値になります。
- date_or_time_expr に小数部の桁数がある場合、戻り値も同じ桁数を持ち、小数部はゼロになります。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから CEIL を計算します（例：`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します。このとき、セッション変数は `+08:00` です）。
- 入力の時刻値（`<date_or_time_expr>` と `<period>`）に TIMESTAMPTZ 型と DATETIME 型が混在する場合、出力は DATETIME 型になります。

## 例

```sql
-- 2023-07-13 is Thursday, rounds up to next interval start (1-week interval starts on Monday, so rounds to 2023-07-17 (Monday))
SELECT WEEK_CEIL(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- Specify 2-week interval
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-24 00:00:00 |
+---------------------+

-- Input date type returns date type, date string returns datetime
SELECT WEEK_CEIL(cast('2023-07-13' as date));
+---------------------------------------+
| WEEK_CEIL(cast('2023-07-13' as date)) |
+---------------------------------------+
| 2023-07-17                            |
+---------------------------------------+

--input with decimal part 
mysql> SELECT WEEK_CEIL('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-24 00:00:00.000 |
+-------------------------+

-- Only with origin date and specified date
select week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+---------------------------------------------------------+
| week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-15 12:00:00                                     |
+---------------------------------------------------------+

-- Specify origin date
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_CEIL
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-05 00:00:00                    |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-05 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 2023-07-13 00:00:00, 0 out of range

-- Parameter is NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
