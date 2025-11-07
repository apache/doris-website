---
{
    "title": "WEEKDAY",
    "language": "en"
}
---

## Description

The WEEKDAY function returns the weekday index value of a date, where Monday is 0, Tuesday is 1, and Sunday is 6.

Note the difference between WEEKDAY and DAYOFWEEK:
```
          +-----+-----+-----+-----+-----+-----+-----+
          | Sun | Mon | Tues| Wed | Thur| Fri | Sat |
          +-----+-----+-----+-----+-----+-----+-----+
  weekday |  6  |  0  |  1  |  2  |  3  |  4  |  5  |
          +-----+-----+-----+-----+-----+-----+-----+
dayofweek |  1  |  2  |  3  |  4  |  5  |  6  |  7  |
          +-----+-----+-----+-----+-----+-----+-----+
```

This function behaves consistently with the [weekday function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekday) in MySQL.

## Syntax
```sql
WEEKDAY(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<datetime_or_date>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value
Returns the index corresponding to the weekday of the date, type INT.

- If input is NULL, returns NULL

## Examples

```sql
-- 2023-10-09 is Monday, returns 0
SELECT WEEKDAY('2023-10-09'); 
+-------------------------+
| WEEKDAY('2023-10-09')   |
+-------------------------+
| 0                       |
+-------------------------+

-- 2023-10-15 is Sunday, returns 6
SELECT WEEKDAY('2023-10-15 18:30:00'); 
+----------------------------------+
| WEEKDAY('2023-10-15 18:30:00')   |
+----------------------------------+
| 6                                |
+----------------------------------+

-- Input is NULL, returns NULL
SELECT WEEKDAY(NULL);
+---------------+
| WEEKDAY(NULL) |
+---------------+
|          NULL |
+---------------+
```
