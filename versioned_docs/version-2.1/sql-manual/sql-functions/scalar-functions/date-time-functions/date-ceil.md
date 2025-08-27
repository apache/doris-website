---
{
    "title": "DATE_CEIL",
    "language": "en"
}
---

## Description

The DATE_CEIL function is used to round up (ceil) a specified date or time value to the nearest start of a specified time interval period. That is, it returns the smallest periodic moment that is not less than the input date and time. The period rules are jointly defined by `period` (number of periods) and `type` (period unit), and all periods are calculated based on the fixed starting point 0001-01-01 00:00:00.

## Syntax

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `date_or_time_expr` | A valid date expression, supporting input of datetime or date type. For specific datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `period` | Specifies the number of units each period consists of, of type INT. The starting time point is 0001-01-01T00:00:00 |
| `type` | Can be: YEAR, Quarter, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns a date or time value representing the result of rounding up the input value to the specified unit.
The rounded result is of the same type as datetime:
- When input is DATE, returns DATE (only the date part, time defaults to 00:00:00);
- When input is DATETIME, returns DATETIME (including date and time).
- For datetime with scale, the return value will also have scale.

Special cases:
- Returns NULL if any parameter is NULL;
- Returns an error if the rounded result exceeds the range supported by the date type (e.g., after '9999-12-31 23:59:59');
- Throws an error if the period parameter is a non-positive integer.

## Examples

```sql
-- Round up seconds to the nearest 5-second interval
mysql> select date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second);

+------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second) |
+------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000000                                             |
+------------------------------------------------------------------------+

-- Date time parameter with scale
mysql> select date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second);
+-----------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18.123" as datetime(3)),interval 5 second) |
+-----------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000                                                     |
+-----------------------------------------------------------------------------+

-- Round up to the nearest 5-minute interval
select date_ceil("2023-07-13 22:28:18",interval 5 minute);
+--------------------------------------------------------------+
| minute_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+

-- Round up to the nearest 5-week interval
select date_ceil("2023-07-13 22:28:18",interval 5 WEEK);
+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 WEEK) |
+--------------------------------------------------+
| 2023-08-14 00:00:00                              |
+--------------------------------------------------+

-- Round up to the nearest 5-hour interval
select date_ceil("2023-07-13 22:28:18",interval 5 hour);

+--------------------------------------------------+
| date_ceil("2023-07-13 22:28:18",interval 5 hour) |
+--------------------------------------------------+
| 2023-07-13 23:00:00                   |
+--------------------------------------------------+

-- Round up to the nearest 5-day interval
select date_ceil("2023-07-13 22:28:18",interval 5 day);

+-----------------------------------------------------------+
| day_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-----------------------------------------------------------+
| 2023-07-15 00:00:00                                       |
+-----------------------------------------------------------+

-- Round up to the nearest 5-month interval
select date_ceil("2023-07-13 22:28:18",interval 5 month);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+

-- Round up to the nearest 5-year interval
select date_ceil("2023-07-13 22:28:18",interval 5 year);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+

-- Exceeds the maximum year
mysql> select date_ceil("9999-07-13",interval 5 year);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 9999-07-13 00:00:00, 5 out of range

-- Any parameter is NULL
mysql> select date_ceil("9900-07-13",interval NULL year);
+--------------------------------------------+
| date_ceil("9900-07-13",interval NULL year) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+

mysql> select date_ceil(NULL,interval 5 year);
+---------------------------------+
| date_ceil(NULL,interval 5 year) |
+---------------------------------+
| NULL                            |
+---------------------------------+

-- Invalid parameter, period is negative
mysql> select date_ceil("2023-01-13 22:28:18",interval -5 month);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation month_ceil of 2023-01-13 22:28:18, -5 input wrong parameters, period can`t be negative or zero
```
