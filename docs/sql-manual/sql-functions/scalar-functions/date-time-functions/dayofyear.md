---
{
    "title": "DAYOFYEAR",
    "language": "en",
    "description": "The DAYOFYEAR function is used to calculate the number of days in the current year corresponding to a date or time expression, i.e.,"
}
---

## Description

The DAYOFYEAR function is used to calculate the number of days in the current year corresponding to a date or time expression, i.e., which day of the year the date is. The return value is an integer ranging from 1 (January 1st) to 366 (December 31st in a leap year).

This function behaves consistently with the [dayofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofyear) in MySQL

## Alias

- DOY

## Syntax

```sql
DAYOFYEAR(<date_or_time_expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns an integer representing the number of days in the current year (1-366), of type SMALLINT.

Special cases:

- If <date_or_time_expr> is NULL, returns NULL;
- For February 29th in a leap year, it will be correctly calculated as the 60th day of the year.

## Examples

```sql

---Extract the day number in the year from datetime type
select dayofyear('2007-02-03 00:00:00');

+----------------------------------+
| dayofyear('2007-02-03 00:00:00') |
+----------------------------------+
|                               34 |
+----------------------------------+

---Extract day number from date type
select dayofyear('2023-12-31');
+-------------------------+
| dayofyear('2023-12-31') |
+-------------------------+
|                     365 |
+-------------------------+


---Calculate day number in a leap year
select dayofyear('2024-12-31');
+-------------------------+
| dayofyear('2024-12-31') |
+-------------------------+
|                     366 |
+-------------------------+

---Input is NULL, returns NULL
select dayofyear(NULL);
+-----------------+
| dayofyear(NULL) |
+-----------------+
|            NULL |
+-----------------+
```