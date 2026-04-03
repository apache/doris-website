---
{
  "title": "DATE_TRUNC",
  "language": "ja",
  "description": "DATETRUNC関数は、日付や時刻の値（datetime）を指定された時間単位（timeunit）で切り捨てるために使用されます。"
}
---
## 説明

DATE_TRUNC関数は、日付または時刻の値（`datetime`）を指定された時間単位（`time_unit`）に切り捨てるために使用されます。これは、指定された単位およびそれより上位レベルの時間情報を保持し、下位レベルの時間情報を最小の日時にリセットすることを意味します。例えば、「時」単位に切り捨てる場合、年、月、日、時は保持され、分、秒などはゼロにリセットされます。年で切り捨てる場合、日と月はxxxx-01-01に切り捨てられます。

## 構文

```sql
DATE_TRUNC(<datetime>, <time_unit>)
DATE_TRUNC(<time_unit>, <datetime>)
```
## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | 有効な日付式で、datetimeまたはdate型をサポートします。具体的な形式については、[timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion)、[datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)、[date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)を参照してください |
| `<time_unit>` | 切り捨てる時間間隔。使用可能な値は：[`second`,`minute`,`hour`,`day`,`week`,`month`,`quarter`,`year`] |

## Return Value

datetimeと同じ型で切り捨てられた結果を返します：
- 入力がDATEの場合、DATEを返します
- 入力がDATETIMEまたは時間を含む文字列の場合、DATETIME（日付と切り捨てられた時間を含む）を返します
- 入力がTIMESTAMPTZ型の場合、まずlocal_time（例：セッション変数が`+08:00`の場合、`2025-12-31 23:59:59+05:00`で表されるlocal_timeは`2026-01-01 02:59:59`）に変換され、その後切り捨て操作が実行されます
- スケールを持つdatetime型の場合、小数部分はゼロに切り捨てられますが、戻り値ではスケールが保持されます

特別なケース：
- いずれかのパラメータがNULLの場合、NULLを返します
- time_unitがサポートされていない場合、エラーを返します

## Examples

```sql
-- Truncate by second, minute, hour, day, week, month, quarter, year
mysql> select date_trunc(cast('2010-12-02 19:28:30' as datetime), 'second');

+---------------------------------------------------------------+
| date_trunc(cast('2010-12-02 19:28:30' as datetime), 'second') |
+---------------------------------------------------------------+
| 2010-12-02 19:28:30                                           |
+---------------------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'minute');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'minute')     |
+-------------------------------------------------+
| 2010-12-02 19:28:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'hour');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'hour')       |
+-------------------------------------------------+
| 2010-12-02 19:00:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'day');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'day')        |
+-------------------------------------------------+
| 2010-12-02 00:00:00                             |
+-------------------------------------------------+

select date_trunc('2023-4-05 19:28:30', 'week');

+-------------------------------------------+
| date_trunc('2023-04-05 19:28:30', 'week') |
+-------------------------------------------+
| 2023-04-03 00:00:00                       |
+-------------------------------------------+

select date_trunc(cast('2010-12-02' as date), 'month');
+-------------------------------------------------+
| date_trunc(cast('2010-12-02' as date), 'month') |
+-------------------------------------------------+
| 2010-12-01                                      |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'quarter');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'quarter')    |
+-------------------------------------------------+
| 2010-10-01 00:00:00                             |
+-------------------------------------------------+

select date_trunc('2010-12-02 19:28:30', 'year');

+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30', 'year')       |
+-------------------------------------------------+
| 2010-01-01 00:00:00                             |
+-------------------------------------------------+

-- For datetime with scale, fractional digits will be truncated to zero without rounding, but return value retains scale
mysql> select date_trunc('2010-12-02 19:28:30.523', 'second');
+-------------------------------------------------+
| date_trunc('2010-12-02 19:28:30.523', 'second') |
+-------------------------------------------------+
| 2010-12-02 19:28:30.000                         |
+-------------------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before truncation
SELECT DATE_TRUNC('2025-12-31 23:59:59+05:00', 'year');
+-------------------------------------------------+
| DATE_TRUNC('2025-12-31 23:59:59+05:00', 'year') |
+-------------------------------------------------+
| 2026-01-01 00:00:00+08:00                       |
+-------------------------------------------------+

-- Unsupported unit, returns error
select date_trunc('2010-12-02 19:28:30', 'quar');
ERROR 1105 (HY000): errCode = 2, detailMessage = date_trunc function time unit param only support argument is year|quarter|month|week|day|hour|minute|second
```
