---
{
    "title": "DAY_CEIL",
    "language": "ja",
    "description": "day_ceil 関数は、指定した日付または時刻の値を、指定した日数単位の直近の開始時点に切り上げます。"
}
---

## 説明


day_ceil 関数は、指定した日付または時刻の値を、指定した日数単位の直近の開始時点に切り上げます。期間の規則は、period（日数）と origin（基準時刻）で定義します。origin を指定しない場合、デフォルトは 0001-01-01 00:00:00 です。

日付の計算式：
$$
\begin{aligned}
&\text{day\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に達するまでに必要な期間の数を表します。

## 構文

```sql
DAY_CEIL(<date_or_time_expr>)
DAY_CEIL(<date_or_time_expr>, <origin>)
DAY_CEIL(<date_or_time_expr>, <period>)
DAY_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型をサポートする有効な日付式です。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 各期間の日数を指定します。型は INT です。省略した場合、デフォルトの期間は 1 日です。 |
| `<origin>` | 期間を計算するときの開始基準時刻です。DATE/DATETIME/TIMESTAMP_NS 型をサポートします。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒が固定の九桁精度である `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、記載されたデフォルトの origin は内部的な位置合わせの基準としてのみ使用され、`TIMESTAMP_NS` 型で格納可能な範囲内である必要はありません。

TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE 型を返します。戻り値は、入力値を指定した日数単位に切り上げた結果を表します。

入力が有効な場合、日時の型に応じた切り上げ結果を返します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換します（例：`2025-12-31 23:59:59+05:00` は local_time では `2026-01-01 02:59:59` を表します。この例のセッション変数は `+08:00` です）。その後に DAY_CEIL を実行します。
- `<date_or_time_expr>` と `<period>` に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、DATETIME 型を返します。

特殊なケース：

- いずれかのパラメータが NULL の場合、NULL を返します。
- period が負の値または 0 の場合、エラーを返します。
- 切り上げ結果が日付型でサポートされる範囲を超える場合（'9999-12-31' より後になる場合など）、エラーが報告されます。
- 小数秒精度を持つ datetime 型の入力では、出力の小数部はすべて 0 に切り捨てられ、戻り値は小数秒精度を保持します。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、期間数 k は負になります。

## 例

```sql
-- Round up with a period of five days
select day_ceil( cast("2023-07-13 22:28:18" as datetime), 5);

+------------------------------------+
| day_ceil("2023-07-13 22:28:18", 5) |
+------------------------------------+
| 2023-07-15 00:00:00                |
+------------------------------------+

-- Datetime input with scale, return value has scale with all decimals as 0
select day_ceil( "2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_ceil( "2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-15 00:00:00.000                 |
+-----------------------------------------+

-- Without specifying period, default to round up by one day
select day_ceil("2023-07-13 22:28:18");

+---------------------------------+
| day_ceil("2023-07-13 22:28:18") |
+---------------------------------+
| 2023-07-14 00:00:00             |
+---------------------------------+

-- Only with origin date and specified date
select day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34");
+--------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34") |
+--------------------------------------------------------+
| 2023-07-14 12:22:34                                    |
+--------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Date and time is exactly at the start of the period
select day_ceil("2023-07-16 00:00:00", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_ceil(cast("2023-07-13" as date), 3);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 3) |
+-----------------------------------------+
| 2023-07-14                              |
+-----------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_CEIL
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00');
+---------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00') |
+---------------------------------------+
| 2026-01-02 00:00:00+08:00             |
+---------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+------------------------------------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+------------------------------------------------------------------+
| 2026-01-02 00:00:00.123                                          |
+------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+---------------------------------------------------------------+
| day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+---------------------------------------------------------------+
| 2023-07-17 08:00:00.000                                       |
+---------------------------------------------------------------+

-- Period time is zero, returns NULL
select day_ceil(cast("2023-07-13" as date), 0);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 0) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+

-- Period is negative
mysql> select day_ceil("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 2023-07-13 22:28:18, -2 out of range

-- Return date exceeds maximum range, returns error
select day_ceil("9999-12-31", 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 9999-12-31 00:00:00, 5 out of range

-- Any parameter is NULL, returns NULL
select day_ceil(NULL, 5, "2023-01-01");

+---------------------------------+
| day_ceil(NULL, 5, "2023-01-01") |
+---------------------------------+
| NULL                            |
+---------------------------------+
```
