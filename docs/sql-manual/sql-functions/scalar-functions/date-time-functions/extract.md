---
{
    "title": "EXTRACT",
    "language": "en",
    "description": "The EXTRACT function is used to extract specific time components from date or time values, such as year, month, week, day, hour, minute, second, etc."
}
---

## Description

The `EXTRACT` function is used to extract specific time components from date or time values, such as year, month, week, day, hour, minute, second, etc. This function can precisely obtain specific parts of a datetime.

This function behaves consistently with the [extract function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) in MySQL. 

## Syntax

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `<unit>` | Enumeration values: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, YEAR_MONTH, DAY_HOUR, DAY_MINUTE, DAY_SECOND, DAY_MICROSECOND, HOUR_MINUTE, HOUR_SECOND, HOUR_MICROSECOND, MINUTE_SECOND, MINUTE_MICROSECOND, SECOND_MICROSECOND, DAYOFWEEK(DOW), DAYOFYEAR(DOY) |
| `<datetime_or_time_expr>` | A valid date expression that supports date/datetime types and strings in date-time format. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns the extracted part of the date or time.
- For independent types like `YEAR` and [DAYOFWEEK(DOW)](./dayofweek.md), [DAYOFYEAR(DOY)](./dayofyear.md), the return type is INT
- For composite types like `YEAR_MONTH`, the return type is STRING

The value range for the week unit is 0-53, calculated as follows:

- Sunday is the first day of the week.
- The week containing the first Sunday of the year is week 1.
- Dates before the first Sunday belong to week 0.

When the unit is year, month, day, hour, minute, second, microsecond, it returns the corresponding unit value in the datetime.

When the unit is quarter, January-March returns 1, April-June returns 2, July-September returns 3, October-December returns 4.

Special cases:
- If <date_or_time_expr> is NULL, returns NULL.
- If <unit> is an unsupported unit, an error is reported.

The format of the composite unit return is as follows:
| time_unit          | return format                             |
| ------------------ | ----------------------------------------- |
| YEAR_MONTH         | 'YEARS-MONTHS'                            |
| DAY_HOUR           | 'DAYS HOURS'                              |
| DAY_MINUTE         | 'DAYS HOURS:MINUTES'                      |
| DAY_SECOND         | 'DAYS HOURS:MINUTES:SECONDS'              |
| DAY_MICROSECOND    | 'DAYS HOURS:MINUTES:SECONDS.MICROSECONDS' |
| HOUR_MINUTE        | 'HOURS:MINUTES'                           |
| HOUR_SECOND        | 'HOURS:MINUTES:SECONDS'                   |
| HOUR_MICROSECOND   | 'HOURS:MINUTES:SECONDS.MICROSECONDS'      |
| MINUTE_SECOND      | 'MINUTES:SECONDS'                         |
| MINUTE_MICROSECOND | 'MINUTES:SECONDS.MICROSECONDS'            |
| SECOND_MICROSECOND | 'SECONDS.MICROSECONDS'                    |

## Examples

```sql
-- Extract year, month, day, hour, minute, second, microsecond time components from datetime
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetime(6))) as microsecond;

+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+

-- Extract quarter from datetime
mysql> select extract(quarter from '2023-05-15') as quarter;
+---------+
| quarter |
+---------+
|       2 |
+---------+

-- Extract week number for the corresponding date. Since the first Sunday of 2024 is on January 7th, all dates before 01-07 return 0
select extract(week from '2024-01-06') as week;
+------+
| week |
+------+
|    0 |
+------+

-- January 7th is the first Sunday, returns 1
select extract(week from '2024-01-07') as week;
+------+
| week |
+------+
|    1 |
+------+

-- Under this rule, 2024 only has weeks 0-52
select extract(week from '2024-12-31') as week;
+------+
| week |
+------+
|   52 |
+------+

select extract(year_month from '2026-01-01 11:45:14.123456') as year_month,
       extract(day_hour from '2026-01-01 11:45:14.123456') as day_hour,
       extract(day_minute from '2026-01-01 11:45:14.123456') as day_minute,
       extract(day_second from '2026-01-01 11:45:14.123456') as day_second,
       extract(day_microsecond from '2026-01-01 11:45:14.123456') as day_microsecond,
       extract(hour_minute from '2026-01-01 11:45:14.123456') as hour_minute,
       extract(hour_second from '2026-01-01 11:45:14.123456') as hour_second,
       extract(hour_microsecond from '2026-01-01 11:45:14.123456') as hour_microsecond,
       extract(minute_second from '2026-01-01 11:45:14.123456') as minute_second,
       extract(minute_microsecond from '2026-01-01 11:45:14.123456') as minute_microsecond,
       extract(second_microsecond from '2026-01-01 11:45:14.123456') as second_microsecond;

+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+
| year_month | day_hour | day_minute | day_second  | day_microsecond       | hour_minute | hour_second | hour_microsecond      | minute_second| minute_microsecond   | second_microsecond |
+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+
| 2026-01    | 1 11     | 1 11:45    | 1 11:45:14  | 1 11:45:14.123456     | 11:45       | 11:45:14    | 11:45:14.123456       | 45:14        | 45:14.123456         | 14.123456         |
+------------+----------+------------+-------------+-----------------------+-------------+-------------+-----------------------+--------------+----------------------+-------------------+

-- Input unit does not exist, reports error
select extract(uint from '2024-01-07') as week;

ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
