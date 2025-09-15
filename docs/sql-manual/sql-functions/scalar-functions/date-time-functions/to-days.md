---
{
    "title": "TO_DAYS",
    "language": "en"
}
---

## Description
A date calculation function that converts a date to a numeric value representing days, calculating the total number of days from December 31, year 1 (the reference date) to the specified date.

This function behaves consistently with the [to_days function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-days) in MySQL.

## Syntax

```sql
TO_DAYS(`<date_or_date_expr>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns BIGINT type representing the number of days.

## Examples

```sql
select to_days('2007-10-07');
```
```text
+---------------------------------------+
| to_days('2007-10-07') |
+---------------------------------------+
|                                733321 |
+---------------------------------------+
```

```sql
select to_days('2007-10-07 10:03:09');
```
```text
+------------------------------------------------+
| to_days('2007-10-07 10:03:09') |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```
