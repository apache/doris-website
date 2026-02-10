---
{
    "title": "EXTRACT",
    "language": "en",
    "description": "The extract function is used to extract a specified part of a date or time value, such as the year, month, day, hour, minute, second, etc."
}
---

## Description

The `extract` function is used to extract a specified part of a date or time value, such as the year, month, day, hour, minute, second, etc. This function is commonly used to extract specific time components from a datetime field for calculation, comparison, or display.

## Syntax

`EXTRACT(<unit> FROM <datetime>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `unit` | The unit to extract from the DATETIME. Possible values are year, month, day, hour, minute, second, or microsecond |
| `datetime` | The argument is a valid date expression |

## Return Value

The return value is the extracted part of the date or time (such as an integer), depending on the unit being extracted.

## Examples

```sql
select extract(year from '2022-09-22 17:01:30') as year,
extract(month from '2022-09-22 17:01:30') as month,
extract(day from '2022-09-22 17:01:30') as day,
extract(hour from '2022-09-22 17:01:30') as hour,
extract(minute from '2022-09-22 17:01:30') as minute,
extract(second from '2022-09-22 17:01:30') as second,
extract(microsecond from cast('2022-09-22 17:01:30.000123' as datetimev2(6))) as microsecond;
```

```text
+------+-------+------+------+--------+--------+-------------+
| year | month | day  | hour | minute | second | microsecond |
+------+-------+------+------+--------+--------+-------------+
| 2022 |     9 |   22 |   17 |      1 |     30 |         123 |
+------+-------+------+------+--------+--------+-------------+
```
