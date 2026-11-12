---
{
    "title": "WEEK_FLOOR",
    "language": "ja",
    "description": "WEEK_FLOOR 関数は、入力日時を、WEEK を単位とする指定された週の間隔の開始時刻に切り下げます。"
}
---

## 説明 {#description}

WEEK_FLOOR 関数は、入力日時を、WEEK を単位とする指定された週の間隔の開始時刻に切り下げます。基準となる開始点（origin）を指定した場合は、その点を基準に間隔を計算します。指定しない場合は、0001-01-01 00:00:00 を基準点として使用します。

日付の計算式：
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ は、基準時刻から対象時刻までの間隔の数を表します。

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
| `<date_or_time_expr>` | 切り下げる日時値。DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型をサポートします。DATE 型は、該当する日付の開始時刻である 00:00:00 に変換されます。具体的な形式については [timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion) を、日時と日付の形式については [datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) と [date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) を参照してください |
| `<period>` | 週の間隔を表す INT 型の値。各間隔に含まれる週数を指定します |
| `<origin>` | 間隔の開始点。DATE/DATETIME/TIMESTAMP_NS 型をサポートします。デフォルトは 0001-01-01 00:00:00 です |

## 戻り値 {#return-value}

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度の `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲に収まるか検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、文書に記載されたデフォルトの開始点は内部的な間隔の基準としてのみ使用されます。この開始点が、`TIMESTAMP_NS` 型で格納可能な範囲に収まる必要はありません。

入力引数に基づいて選択された時間型で、切り下げ後の日時値を返します。結果の時刻部分には origin の時刻が設定されます。

- 入力が NULL ではなく、`<period>` が正の値でない（≤0）場合、エラーを返します。
- いずれかのパラメータが NULL の場合、NULL を返します。
- `<datetime>` が（`<period>` と `<origin>` に基づく）間隔の開始点と完全に一致する場合、その開始点を返します。
- 入力が date 型の場合、date 型を返します。
- 入力が datetime 型の場合、origin と同じ時刻部分を持つ datetime 型を返します。
- `<origin>` の日時が `<date_or_time_expr>` より後であっても、上記の式に従って計算されます。この場合、間隔を表す k は負の値になります。
- `date_or_time_expr` にスケールがある場合、結果は対応する精度を維持します。`origin` に小数秒が含まれる場合、間隔の境界もその小数秒を維持します。Doris 4.1 系列の 4.1.5 以降では、週の境界の比較でマイクロ秒が考慮され、入力と `origin` の差が小数秒部分だけの場合の切り下げが修正されています。
- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換され（例：セッション変数が `+08:00` の場合、`2025-12-31 23:59:59+05:00` は local_time の `2026-01-01 02:59:59` を表します）、その後で FLOOR の計算が行われます。
- 入力時刻の値（`<date_or_time_expr>` と `<origin>`）に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型になります。

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

間隔の境界と完全に一致する入力は変更されません。

```sql
SELECT WEEK_FLOOR('2023-07-10 00:00:00', 2);
```

```text
2023-07-10 00:00:00
```

マイクロ秒を含む origin による週の境界（Doris 4.1 系列の 4.1.5 以降で修正）：

```sql
SELECT WEEK_FLOOR(CAST('2024-01-08 00:00:00.400000' AS DATETIME(6)),
                   1, CAST('2024-01-01 00:00:00.500000' AS DATETIME(6)));
```

```text
2024-01-01 00:00:00.500000
```
