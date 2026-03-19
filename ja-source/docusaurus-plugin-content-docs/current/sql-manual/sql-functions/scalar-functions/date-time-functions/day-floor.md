---
{
  "title": "DAY_FLOOR",
  "language": "ja",
  "description": "DAYFLOOR関数は、指定された日付または時刻の値を、最も近い指定された日期間の開始時点まで切り下げるために使用されます。"
}
---
## 説明

DAY_FLOOR関数は、指定された日付または時刻の値を、最も近い指定された日周期の開始時刻まで切り下げるために使用されます。この関数は、入力された日付と時刻以下の最大の周期モーメントを返します。周期ルールは、period（周期内の日数）とorigin（開始基準時刻）によって共同で定義されます。開始基準時刻が指定されていない場合、デフォルトで0001-01-01 00:00:00が計算基準として使用されます。

日付計算式：

$$
\text{DAY\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$は基準時刻から対象時刻までの周期数を表します。

## 構文

```sql
DAY_FLOOR(<date_or_time_expr>)
DAY_FLOOR(<date_or_time_expr>, <origin>)
DAY_FLOOR(<date_or_time_expr>, <period>)
DAY_FLOOR(<date_or_time_expr>, <period>, <origin>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<date_or_time_expr>` | date/datetime/timestamptz型をサポートする有効な日付式。Date型は対応する日付の開始時刻00:00:00に変換されます。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 各期間の日数を指定します。INT型。負の値または0の場合はNULLを返します。指定しない場合、デフォルトの期間は1日です。 |
| `<origin>` | 期間計算の開始基準時刻。date/datetime型をサポートします。 |

## 戻り値

TIMESTAMPTZ、DATETIME、またはDATEを返します。指定された日期間に入力値を切り捨てた結果を表します。

入力が有効な場合、datetime型と一致する丸め結果を返します：

- 入力がTIMESTAMPTZの場合、まずlocal_timeに変換され（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`はlocal_time `2026-01-01 02:59:59`を表します）、その後DAY_FLOORが実行されます。
- `<date_or_time_expr>`と`<period>`の両方がTIMESTAMPTZとDATETIMEを含む場合、出力はDATETIMEになります。

特殊ケース：

- いずれかのパラメータがNULLの場合、NULLを返します。
- periodが負の値または0の場合、エラーを返します。
- スケールを持つdatetime入力の場合、出力は小数部がすべて0のスケールを持ちます。
- `<origin>`の日時が`<period>`より後の場合でも、上記の公式に従って計算されますが、期間kは負の値になります。

## 例

```sql
-- Round down with a period of five days
select day_floor("2023-07-13 22:28:18", 5);

+-------------------------------------+
| day_floor("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-10 00:00:00                 |
+-------------------------------------+


-- Datetime input with scale, return value has scale with all decimals as 0
mysql> select day_floor("2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_floor("2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-10 00:00:00.000                 |
+-----------------------------------------+


-- Input parameter without period, default to one day as period
select day_floor("2023-07-13 22:28:18");
+----------------------------------+
| day_floor("2023-07-13 22:28:18") |
+----------------------------------+
| 2023-07-13 00:00:00              |
+----------------------------------+

-- Only with origin date and specified date
select day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00");
+---------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-13 12:00:00                                     |
+---------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Start time is exactly at the beginning of a period, returns input date time
select day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_floor(cast("2023-07-13" as date), 3);
+------------------------------------------+
| day_floor(cast("2023-07-13" as date), 3) |
+------------------------------------------+
| 2023-07-11                               |
+------------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_FLOOR
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Period is negative, returns error
select day_floor("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_floor of 2023-07-13 22:28:18, -2 out of range

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+----------------------------------------------------------------+
| day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 08:00:00.000                                        |
+----------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
select day_floor(NULL, 5, "2023-01-01");
+----------------------------------+
| day_floor(NULL, 5, "2023-01-01") |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
