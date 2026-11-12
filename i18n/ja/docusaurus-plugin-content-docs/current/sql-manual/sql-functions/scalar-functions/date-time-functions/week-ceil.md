---
{
    "title": "WEEK_CEIL",
    "language": "ja",
    "description": "weekceil 関数は、入力された日時の値を、指定された週単位の区間の直近の開始時刻に切り上げます。origin を指定した場合は、"
}
---

## 説明 {#description}


week_ceil 関数は、入力された日時の値を、指定された週単位の区間の直近の開始時刻に切り上げます。origin を指定した場合はそれを基準とし、指定しない場合は 0001-01-01 00:00:00 を基準とします。

日付の計算式：
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な区間の数を表します。

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
| `<date_or_time_expr>` | 切り上げる日時の値。DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型をサポートします。DATE 型の値は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については [timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を、datetime/date の形式については [datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<period>` | 週単位の区間の値。型は INT で、各区間に含まれる週数を表します |
| `<origin>` | 区間の起点。DATE/DATETIME/TIMESTAMP_NS 型をサポートします。デフォルトは 0001-01-01 00:00:00 です |

## 戻り値 {#return-value}

`TIMESTAMP_NS` 型の入力に対しては、小数部が固定で9桁の精度を持つ `TIMESTAMP_NS` 型の値を返します。結果が戻り値の型の範囲内にあるか検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`TIMESTAMP_NS` 型の入力で `<origin>` を省略した場合、文書に記載されたデフォルトの起点は内部で区間を揃えるための基準としてのみ使用され、`TIMESTAMP_NS` 型で格納可能な範囲内にある必要はありません。

入力引数に基づいて選択された時間型で、切り上げ後の日時の値を返します。

- 入力が NULL ではなく、`<period>` が正の値でない（≤0）場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が（`<period>` と `<origin>` に基づく）区間の開始時点と完全に一致する場合、その開始時点を返します。
- 入力が DATE 型の場合、DATE 型を返します。
- 入力が DATETIME 型の場合、起点の時刻部分と同じ時刻部分を持つ DATETIME 型の値を返します。
- 計算結果が日時の最大値 9999-12-31 23:59:59 を超える場合、エラーを返します。
- `<origin>` の日時が `<date_or_time_expr>` より後の場合も、上記の式に従って計算します。この場合、区間数 k は負になります。
- `date_or_time_expr` に小数秒の精度がある場合、結果にも対応する精度が保持されます。`origin` に小数秒が含まれる場合、区間の境界にもその小数秒が保持されます。Doris 4.1 系では 4.1.5 以降、週の境界を比較するときにマイクロ秒が考慮され、入力と `origin` の差が小数秒のみである場合の切り上げが修正されています。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換し（たとえば、セッション変数が `+08:00` の場合、`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します）、その後 CEIL 計算を実行します。
- 入力の時刻値（`<date_or_time_expr>` と `<origin>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

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

区間の境界と完全に一致する入力は変更されません：

```sql
SELECT WEEK_CEIL('2023-07-24 00:00:00', 2);
```

```text
2023-07-24 00:00:00
```

マイクロ秒を含む起点を使用した週の境界（Doris 4.1 系の 4.1.5 以降で修正）：

```sql
SELECT WEEK_CEIL(CAST('2024-01-08 00:00:00.600000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-15 00:00:00.500000
```
