---
{
    "title": "DAY_CEIL",
    "language": "ja",
    "description": "dayceil 関数は、指定された日付または時刻の値を、指定した日数間隔の入力値以上で最も近い開始時刻まで切り上げます。"
}
---

## 説明


day_ceil 関数は、指定された日付または時刻の値を、指定した日数間隔の入力値以上で最も近い開始時刻まで切り上げます。間隔は period（日数）と origin（基準時刻）で定義されます。origin を指定しない場合、デフォルトは 0001-01-01 00:00:00 です。

日付の計算式：
$$
\begin{aligned}
&\text{day\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ は、基準時刻から対象時刻に到達するまでに必要な間隔の数を表します。

## 構文

```sql
DAY_CEIL(<date_or_time_expr>)
DAY_CEIL(<date_or_time_expr>, <origin>)
DAY_CEIL(<date_or_time_expr>, <period>)
DAY_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## 引数

| 引数 | 説明 |
| -- | -- |
| `<date_or_time_expr>` | DATE、DATETIME、TIMESTAMPTZ 型に対応する有効な日付式。具体的な形式については、[TIMESTAMPTZ の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[DATETIME の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[DATE の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 各間隔の日数を指定します。型は INT です。省略した場合、デフォルトの間隔は 1 日です。 |
| `<origin>` | 間隔の計算に使用する開始基準時刻です。DATE 型と DATETIME 型に対応します。 |

## 戻り値

入力値を指定した日数間隔に切り上げた結果を表す、TIMESTAMPTZ、DATETIME、または DATE 型の値を返します。

入力が有効な場合は、日時の型に応じた切り上げ結果を返します。

- 入力が TIMESTAMPTZ 型の場合、まず local_time に変換してから DAY_CEIL を実行します（たとえば、`2025-12-31 23:59:59+05:00` が表す local_time は `2026-01-01 02:59:59` です。これはセッション変数が `+08:00` の場合です）。
- `<date_or_time_expr>` と `<period>` に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、DATETIME 型を返します。

特殊なケース：

- いずれかの引数が NULL の場合は、NULL を返します。
- period が負の値または 0 の場合は、エラーを返します。
- 切り上げ結果が日付型のサポート範囲を超える場合（たとえば '9999-12-31' より後になる場合）は、エラーが報告されます。
- スケール付きの DATETIME 入力では、小数部のすべての桁が 0 になり、戻り値にもスケールが付きます。
- `<origin>` の日時が `<period>` より後であっても、上記の式に従って計算されます。この場合、間隔数 k は負の値になります。

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
