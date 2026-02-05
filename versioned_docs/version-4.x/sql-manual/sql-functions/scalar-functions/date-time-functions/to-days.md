---
{
    "title": "TO_DAYS",
    "language": "en",
    "description": "A date calculation function that converts a date to a numeric value representing days,"
}
---

## Description
A date calculation function that converts a date to a numeric value representing days, calculating the total number of days from the base date (`0000-00-00`) to the specified date

This function behaves consistently with the [to_days function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days) in MySQL.

## Syntax

```sql
TO_DAYS(`<date_or_date_expr>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns BIGINT type representing the number of days.

## Examples

```sql
-- Based on the date `0000-00-00`
select to_days('0000-01-01');
+-----------------------+
| to_days('0000-01-01') |
+-----------------------+
|                     1 |
+-----------------------+

--input date type
select to_days('2007-10-07');
+---------------------------------------+
| to_days('2007-10-07') |
+---------------------------------------+
|                                733321 |
+---------------------------------------+

--input datetime type
select to_days('2007-10-07 10:03:09');
+------------------------------------------------+
| to_days('2007-10-07 10:03:09') |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```
