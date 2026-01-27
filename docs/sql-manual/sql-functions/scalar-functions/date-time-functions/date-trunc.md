---
{
    "title": "DATE_TRUNC",
    "language": "en",
    "description": "The DATETRUNC function is used to truncate a date or time value (datetime) to a specified time unit (timeunit)."
}
---

## Description

The DATE_TRUNC function is used to truncate a date or time value (`datetime`) to a specified time unit (`time_unit`). This means retaining the time information at the specified unit and higher levels, while resetting the time information at lower levels to the minimum date time. For example, when truncating to the "hour" unit, the year, month, day, and hour are retained, and minutes, seconds, etc., are reset to zero. When truncating by year, the day and month are truncated to xxxx-01-01.

## Syntax

```sql
DATE_TRUNC(<datetime>, <time_unit>)
DATE_TRUNC(<time_unit>, <datetime>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | A valid date expression, supporting datetime or date type. For specific formats, please refer to [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<time_unit>` | The time interval to truncate to. The available values are: [`second`,`minute`,`hour`,`day`,`week`,`month`,`quarter`,`year`] |

## Return Value

Returns a truncated result with the same type as datetime:
- When input is DATE, returns DATE ;
- When input is DATETIME or a time-containing string, returns DATETIME (including the date and the truncated time).
- If the input is of TIMESTAMPTZ type, it will first be converted to local_time (for example, in the case where the session variable is `+08:00`, the local_time represented by `2025-12-31 23:59:59+05:00` is `2026-01-01 02:59:59`), and then the truncation operation will be performed.
- For datetime types with scale, the fractional part will be truncated to zero but the scale will be preserved in the return value.

Special cases:
- Returns NULL if any parameter is NULL;
- Returns an error if time_unit is not supported.

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