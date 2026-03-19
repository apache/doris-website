---
{
  "title": "WEEK_CEIL",
  "language": "ja",
  "description": "weekceil関数は、入力されたdatetime値を指定された週間隔の開始時刻まで切り上げます。originが指定されている場合、"
}
---
## 説明

week_ceil関数は、入力されたdatetime値を指定された週間隔の開始時刻に切り上げます。originが指定されている場合はそれを基準として使用し、そうでない場合は0000-01-01 00:00:00をデフォルトとします。

日付計算式：
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$は基準時刻から目標時刻に到達するために必要な期間数を表します。

## 構文

```sql
WEEK_CEIL(`<date_or_time_expr>`)
WEEK_CEIL(`<date_or_time_expr>`, `<origin>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り上げる日時値。date/datetime/timestamptz 型をサポートします。date 型は対応する日の開始時刻 00:00:00 に変換されます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を参照し、datetime/date 形式については [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<period>` | 週間隔値。INT 型で、各間隔の週数を表します |
| `<origin>` | 間隔の開始点。date/datetime 型をサポートします。デフォルトは 0000-01-01 00:00:00 です |

## 戻り値

DATETIME 型を返し、切り上げられた日時値を表します。

- `<period>` が非正整数（≤0）の場合、関数はエラーを返します
- いずれかのパラメータが NULL の場合、NULL を返します
- `<datetime>` が間隔の開始点（`<period>` と `<origin>` に基づく）と正確に一致する場合、その開始点を返します
- 入力が date 型の場合、date 型を返します
- 入力が datetime 型の場合、origin 時刻と同じ時刻部分を持つ datetime 型を返します
- 計算結果が最大日時 9999-12-31 23:59:59 を超える場合、エラーを返します
- `<origin>` の日時が `<period>` より後の場合でも、上記の公式に従って計算されますが、期間 k は負の値になります
- date_or_time_expr に scale がある場合、返される結果も小数部分がゼロの scale を持ちます
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換され（例：セッション変数が `+08:00` の場合、`2025-12-31 23:59:59+05:00` は local_time `2026-01-01 02:59:59` を表します）、その後 CEIL 計算を実行します
- 入力時刻値（`<date_or_time_expr>` と `<period>`）が TIMESTAMPTZ と DATETIME の両方の型を含む場合、出力は DATETIME 型になります

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
