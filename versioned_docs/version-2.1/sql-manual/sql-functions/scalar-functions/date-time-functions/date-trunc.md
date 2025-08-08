---
{
    "title": "DATE_TRUNC",
    "language": "en"
}
---

## Description

The DATE_TRUNC function is used to truncate a date or time value (`datetime`) to a specified time unit (`time_unit`). This means retaining the time information at the specified unit and higher levels, while resetting the time information at lower levels to zero. For example, when truncating to the "hour" unit, the year, month, day, and hour are retained, and minutes, seconds, etc., are reset to zero.

## Syntax

```sql
DATE_TRUNC(<datetime>, <time_unit>)
DATE_TRUNC(<time_unit>, <datetime>)
```

## Parameter

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression, support `datetime` or `date` type and `string` types that conform to the format |
| `<time_unit>` | The time interval to truncate to. The available values are: [second,minute,hour,day,week,month,quarter,year] |

## Return value

If the input is valid, the truncated result has the same type as `datetime`:

- When input is DATE, returns DATE (date part only, time defaults to 00:00:00);
- When input is DATETIME or a time-containing string, returns DATETIME (including the date and the truncated time).

Special cases:

- Returns NULL if any parameter is NULL;
- If the input parameters are invalid (such as an incorrectly formatted date(e.g., 2022-2-32 13:21:03; for specific datetime formats, please refer to [cast to datetime](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion/) and [cast to date](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/date-conversion/)), an illegal time unit, etc.), the function returns NULL.

## Examples

```sql

--- Truncate by second, minute, hour, day, week, month, quarter, year
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

```

Special Cases
```sql
--- Invalid date, returns NULL

mysql> select date_trunc('2023-02-30', 'day');
+---------------------------------+
| date_trunc('2023-02-30', 'day') |
+---------------------------------+
| NULL                            |
+---------------------------------+

--- Any parameter is NULL, returns NULL

mysql> select date_trunc(null, 'day');
+-------------------------+
| date_trunc(null, 'day') |
+-------------------------+
| NULL                    |
+-------------------------+

--- Invalid unit, returns error
mysql> select date_trunc('2023-02-28', 'microsecond');
ERROR 1105 (HY000): errCode = 2, detailMessage = date_trunc function time unit param only support argument is year|quarter|month|week|day|hour|minute|second


---date is not in the range of[0000,9999],return null
mysql> select date_trunc('20234-02-30', 'day');
+----------------------------------+
| date_trunc('20234-02-30', 'day') |
+----------------------------------+
| NULL                             |
+----------------------------------+
```