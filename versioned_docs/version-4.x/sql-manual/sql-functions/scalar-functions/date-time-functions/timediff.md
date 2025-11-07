---
{
    "title": "TIMEDIFF",
    "language": "en"
}
---

## Description

The TIMEDIFF function calculates the difference between two datetime values and returns the result as a TIME type. This function supports processing DATETIME and DATE types. If the input is DATE type, its time portion defaults to 00:00:00.

This function behaves consistently with the [timediff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timediff) in MySQL.

## Syntax

```sql
TIMEDIFF(<date_or_time_expr1>, <date_or_time_expr2>)
```

## Parameters

| Parameter              | Description                                                                                                                                                                                                                                                              |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr1>` | The ending time or datetime value. Supports date/datetime type input. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | The starting time or datetime value. Supports date/datetime type input                                                                                                                                                                                                  |

## Return Value

Returns a `TIME` type value representing the time difference between the two inputs:
- When `<end_datetime>` is later than `<start_datetime>`, returns a positive time difference
- When `<end_datetime>` is earlier than `<start_datetime>`, returns a negative time difference
- When `<end_datetime>` and `<start_datetime>` are equal, returns `00:00:00`
- If `<end_datetime>` or `<start_datetime>` is `NULL`, the function returns `NULL`
- When the returned time difference is not an integer number of seconds, the returned time has a scale
- When the calculation result exceeds the time range [-838:59:59, 838:59:59], returns an error

## Examples

```sql
-- Difference between two DATETIMEs (spanning days)
SELECT TIMEDIFF('2024-07-20 16:59:30', '2024-07-11 16:35:21') AS result;
+-----------+
| result    |
+-----------+
| 216:24:09 |
+-----------+

-- Difference between datetime and date (date defaults to 00:00:00)
SELECT TIMEDIFF('2023-10-05 15:45:00', '2023-10-05') AS result;
+-----------+
| result    |
+-----------+
| 15:45:00  |
+-----------+

-- End time earlier than start time (returns negative value)
SELECT TIMEDIFF('2023-01-01 09:00:00', '2023-01-01 10:30:00') AS result;
+------------+
| result     |
+------------+
| -01:30:00  |
+------------+

-- Time difference within the same date
SELECT TIMEDIFF('2023-12-31 23:59:59', '2023-12-31 23:59:50') AS result;
+-----------+
| result    |
+-----------+
| 00:00:09  |
+-----------+

-- Difference across years
SELECT TIMEDIFF('2024-01-01 00:00:01', '2023-12-31 23:59:59') AS result;
+-----------+
| result    |
+-----------+
| 00:00:02  |
+-----------+

-- When returned time is not an integer number of seconds, returns time with scale
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2023-07-13 12:34:50.123') AS result;
+-----------+
| result    |
+-----------+
| 00:00:06  |
+-----------+

-- Calculation result exceeds time size range, returns error
SELECT TIMEDIFF('2023-07-13 12:34:56.789', '2024-07-13 12:34:50.123') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function timediff result of 2023-07-13 12:34:56.789000, 2024-07-13 12:34:50.123000 is out of range

-- Any parameter is NULL (returns NULL)
SELECT TIMEDIFF(NULL, '2023-01-01 00:00:00'), TIMEDIFF('2023-01-01 00:00:00', NULL) AS result;
+---------------------------------------+--------+
| timediff(NULL, '2023-01-01 00:00:00') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+
```