---
{
    "title": "WEEK_CEIL",
    "language": "ja",
    "description": "weekceil 関数は、入力された日時値を指定された最も近い週間隔の開始時刻に切り上げます。origin が指定されている場合は、"
}
---

## 説明 {#description}

week_ceil 関数は、入力された日時値を、指定された週間隔の最も近い開始時刻に切り上げます。origin が指定されている場合はそれを基準として使用し、指定されていない場合は 0001-01-01 00:00:00 を既定値とします。

日付計算式：
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するために必要な期間数を表します。

## 構文 {#syntax}

```sql
WEEK_CEIL(<date_or_time_expr>)
WEEK_CEIL(<date_or_time_expr>, <origin>)
WEEK_CEIL(<date_or_time_expr>, <period>)
WEEK_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り上げる日時値。date/datetime/timestamptz 型をサポートします。date 型は、対応する日付の開始時刻 00:00:00 に変換されます。具体的な形式については [timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を、datetime/date の形式については [datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<period>` | 週間隔の値。型は INT で、各間隔の週数を表します |
| `<origin>` | 間隔の開始点。date/datetime 型をサポートし、既定値は 0001-01-01 00:00:00 です |

## 戻り値 {#return-value}

切り上げ後の日時値を表す TIMESTAMPTZ、DATETIME、または DATE を返します。

- 入力が非 NULL で `<period>` が非正（≤0）の場合、関数はエラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が（`<period>` と `<origin>` に基づく）間隔の開始点と完全に一致する場合、その開始点を返します。
- 入力が date 型の場合、date 型を返します。
- 入力が datetime 型の場合、origin 時刻と同じ時刻部分を持つ datetime 型を返します。
- 計算結果が最大日時 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日付時刻が `<date_or_time_expr>` より後であっても、上記の式に従って計算されますが、期間 k は負になります。
- `date_or_time_expr` に scale がある場合、結果は対応する精度を保持します。`origin` に小数秒が含まれる場合、間隔境界もその小数を保持します。Doris 4.1 シリーズでは 4.1.5 以降、週境界の比較でマイクロ秒が考慮され、入力と `origin` の違いが小数秒だけの場合の丸めが修正されています。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換され（例：`2025-12-31 23:59:59+05:00` は、セッション変数が `+08:00` の場合、local_time `2026-01-01 02:59:59` を表します）、その後 CEIL 計算を行います。
- 入力時刻値（`<date_or_time_expr>` と `<origin>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型です。

<a id="examples"></a>

## 例 {#example}

```sql
-- 2023-07-13 is Thursday, rounds up to next interval start (1-week interval starts on Monday, so rounds to 2023-07-17 (Monday))
SELECT WEEK_CEIL(cast('2023-07-13 22:28:18' as datetime)) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+
```

```sql
-- Specify 2-week interval
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-24 00:00:00 |
+---------------------+
```

```sql
-- Input date type returns date type, date string returns datetime
SELECT WEEK_CEIL(cast('2023-07-13' as date));
```

```text
+---------------------------------------+
| WEEK_CEIL(cast('2023-07-13' as date)) |
+---------------------------------------+
| 2023-07-17                            |
+---------------------------------------+
```

```sql
--input with decimal part
SELECT WEEK_CEIL('2023-07-13 22:28:18.123', 2) AS result;
```

```text
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-24 00:00:00.000 |
+-------------------------+
```

```sql
-- Only with origin date and specified date
select week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00");
```

```text
+---------------------------------------------------------+
| week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-15 12:00:00                                     |
+---------------------------------------------------------+
```

```sql
-- Specify origin date
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+
```

```sql
-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_CEIL
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00');
```

```text
+----------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-05 00:00:00+08:00              |
+----------------------------------------+
```

```sql
-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
```

```text
+-------------------------------------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-05 00:00:00.123                                           |
+-------------------------------------------------------------------+
```

```sql
-- Invalid period (non-positive integer)
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 2023-07-13 00:00:00, 0 out of range
```

```sql
-- Parameter is NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

間隔境界上に正確に一致する入力は変更されません：

```sql
SELECT WEEK_CEIL('2023-07-24 00:00:00', 2);
```

```text
2023-07-24 00:00:00
```

マイクロ秒の origin を使用した週境界（Doris 4.1 シリーズで 4.1.5 以降に修正）：

```sql
SELECT WEEK_CEIL(CAST('2024-01-08 00:00:00.600000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-15 00:00:00.500000
```
