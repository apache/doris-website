---
{
    "title": "DAY_FLOOR",
    "language": "ja",
    "description": "DAY_FLOOR 関数は、指定した日付または時刻を、指定した日数の期間のうち、その値以前で最も近い開始時刻に切り下げます。"
}
---

## 説明

DAY_FLOOR 関数は、指定した日付または時刻を、指定した日数の期間のうち、その値以前で最も近い開始時刻に切り下げます。入力日時を超えない期間の開始時刻のうち、最大の値を返します。期間の規則は、period（期間の日数）と origin（基準となる開始時刻）によって決まります。基準となる開始時刻を指定しない場合、計算の基準には既定で 0001-01-01 00:00:00 が使用されます。

日付の計算式:

$$
\text{DAY\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ は、基準時刻から対象時刻までの期間数を表します。

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
| `<date_or_time_expr>` | DATE/DATETIME/TIMESTAMP_NS/TIMESTAMPTZ 型をサポートする有効な日付式。DATE 型は、該当する日付の開始時刻 00:00:00 に変換されます。具体的な形式については、[timestamptz の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date の変換](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください。 |
| `<period>` | 各期間の日数を指定する INT 型の値。負数または 0 の場合は NULL を返します。省略した場合、既定の期間は 1 日です。 |
| `<origin>` | 期間の計算に使用する基準の開始時刻。DATE/DATETIME/TIMESTAMP_NS 型をサポートします。 |

## 戻り値

`TIMESTAMP_NS` 型の入力に対しては、小数秒の精度が固定の九桁である `TIMESTAMP_NS` 型を返します。結果は戻り値の型の範囲に照らして検証されます。`TIMESTAMP_NS` 型の範囲は `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]` です。

`<origin>` を省略した `TIMESTAMP_NS` 型の入力では、文書に記載された既定の基準時刻は内部での期間の位置合わせにのみ使用されるため、`TIMESTAMP_NS` 型で格納可能な範囲内である必要はありません。

入力値を指定した日数の期間に切り下げた結果を表す、TIMESTAMPTZ、TIMESTAMP_NS、DATETIME、または DATE 型の値を返します。

入力が有効な場合は、日時型に応じた切り下げ結果を返します。

- TIMESTAMPTZ 型の入力は、まず local_time に変換してから DAY_FLOOR を実行します。たとえば、`2025-12-31 23:59:59+05:00` は local_time で `2026-01-01 02:59:59` を表します（セッション変数が `+08:00` の場合）。
- `<date_or_time_expr>` と `<period>` に TIMESTAMPTZ 型と DATETIME 型の両方が含まれる場合、出力は DATETIME 型です。

特殊なケース:

- いずれかのパラメータが NULL の場合、NULL を返します。
- period が負数または 0 の場合、エラーを返します。
- 小数秒の桁数を持つ DATETIME 型を入力した場合、出力もその桁数を持ち、小数部はすべて 0 になります。
- `<origin>` の日時が `<period>` より後の場合も、上記の式に従って計算されます。ただし、期間数 k は負になります。

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
