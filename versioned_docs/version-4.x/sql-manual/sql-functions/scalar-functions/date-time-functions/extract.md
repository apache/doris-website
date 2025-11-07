---
{
    "title": "EXTRACT",
    "language": "en"
}
---

## Description

The `EXTRACT` function is used to extract specific time components from date or time values, such as year, month, week, day, hour, minute, second, etc. This function can precisely obtain specific parts of a datetime.

This function behaves mostly consistently with the [extract function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_extract) in MySQL. The difference is that Doris currently does not support combined unit inputs, such as:

```sql
mysql> SELECT EXTRACT(YEAR_MONTH FROM '2019-07-02 01:02:03');
        -> 201907
```

## Syntax

`EXTRACT(<unit> FROM <date_or_time_expr>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `<unit>` | Extract the value of a specified unit from DATETIME. The unit can be year, month, week, day, hour, minute, second, or microsecond |
| `<datetime_or_time_expr>` | A valid date expression that supports date/datetime types and strings in date-time format. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns the extracted part of the date or time, of type INT, depending on the extracted unit.

The value range for the week unit is 0-53, calculated as follows:

- Sunday is the first day of the week.
- The week containing the first Sunday of the year is week 1.
- Dates before the first Sunday belong to week 0.

When the unit is year, month, day, hour, minute, second, microsecond, it returns the corresponding unit value in the datetime.

When the unit is quarter, January-March returns 1, April-June returns 2, July-September returns 3, October-December returns 4.

Special cases:

If <date_or_time_expr> is NULL, returns NULL.
If <unit> is an unsupported unit, an error is reported.

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

-- Input unit does not exist, reports error
select extract(uint from '2024-01-07') as week;

ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'uint'
```
