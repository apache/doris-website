---
{
    "title": "WEEK_FLOOR",
    "language": "ja",
    "description": "WEEKFLOOR 関数は、入力された日時値を、間隔単位 WEEK の指定された週間隔の開始時刻のうち最も近い時刻に切り捨てます。"
}
---

## 説明 {#description}

WEEK_FLOOR 関数は、入力された日時値を、間隔単位 WEEK の指定された週間隔の開始時刻のうち最も近い時刻に切り捨てます。開始参照点（origin）を指定した場合はその点を基準に間隔を計算し、指定しない場合は 0001-01-01 00:00:00 を参照点として使用します。

日時計算式：
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ は、基準時刻から対象時刻までの間隔数を表します。

## 構文 {#syntax}

```sql
WEEK_FLOOR(<date_or_time_expr>)
WEEK_FLOOR(<date_or_time_expr>, <origin>)
WEEK_FLOOR(<date_or_time_expr>, <period>)
WEEK_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
|-----------|-------------|
| `<date_or_time_expr>` | 切り捨てる日時値。date/datetime/timestamptz 型をサポートします。date 型は、対応する日付の開始時刻 00:00:00 に変換されます。具体的な形式については [timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を参照し、datetime/date の形式については [datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) および [date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください。|
| `<period>` | 週の間隔値。型は INT で、各間隔の週数を表します。|
| `<origin>` | 間隔の開始点。date/datetime 型をサポートし、デフォルトは 0001-01-01 00:00:00 です。|

## 返り値 {#return-value}

TIMESTAMPTZ、DATETIME、または DATE を返し、切り捨て後の日時値を表します。時刻部分は origin によって決まります。

- 入力が NULL ではなく、`<period>` が非正（≤0）の場合、関数はエラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が `<period>` と `<origin>` に基づく間隔の開始点と完全に一致する場合、その開始点を返します。
- 入力が date 型の場合、date 型を返します。
- 入力が datetime 型の場合、origin の時刻部分と同じ時刻部分を持つ datetime 型を返します。
- `<origin>` の日付と時刻が `<date_or_time_expr>` より後の場合も、上記の式に従って計算されますが、期間 k は負になります。
- `date_or_time_expr` に scale がある場合、結果は対応する精度を保持します。`origin` に小数秒が含まれる場合、間隔境界もその小数を保持します。Doris 4.1 シリーズでは 4.1.5 以降、週境界の比較でマイクロ秒を考慮し、入力と `origin` の小数秒だけが異なる場合の丸めを修正しています。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換されます（例：`2025-12-31 23:59:59+05:00` は local_time `2026-01-01 02:59:59` を表します。これはセッション変数が `+08:00` の場合です）。その後 FLOOR 計算を実行します。
- 入力の時間値（`<date_or_time_expr>` と `<origin>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

<a id="examples"></a>

## 例 {#example}

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- input with decimal part
SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
```

```text
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+
```

```sql
-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
```

```text
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+
```

```sql
-- Only with origin date and specified date
select week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00");
```

```text
+----------------------------------------------------------+
| week_floor("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+----------------------------------------------------------+
| 2023-07-08 12:00:00                                      |
+----------------------------------------------------------+
```

```sql
-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
```

```text
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+
```

```sql
-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_FLOOR
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00');
```

```text
+-----------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00') |
+-----------------------------------------+
| 2025-12-29 00:00:00+08:00               |
+-----------------------------------------+
```

```sql
-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
```

```text
+--------------------------------------------------------------------+
| WEEK_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2025-12-29 00:00:00.123                                            |
+--------------------------------------------------------------------+
```

```sql
-- Invalid period, returns error
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range
```

```sql
-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

間隔境界上にある入力は、そのまま返されます：

```sql
SELECT WEEK_FLOOR('2023-07-10 00:00:00', 2);
```

```text
2023-07-10 00:00:00
```

マイクロ秒の `origin` を使用した週境界（Doris 4.1 シリーズでは 4.1.5 以降に修正）：

```sql
SELECT WEEK_FLOOR(CAST('2024-01-08 00:00:00.400000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-01 00:00:00.500000
```
