---
{
    "title": "MINUTES_DIFF",
    "language": "en"
}
---

## Description

The MINUTES_DIFF function calculates the difference in minutes between two datetime values. The result is the number of minutes obtained by subtracting the start time from the end time. This function supports processing DATE and DATETIME (including microsecond precision) types.

## Syntax

```sql
MINUTES_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | The end time, which can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | The start time, which can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Return Value

Returns an INT type integer representing the minute difference between `<date_or_time_expr1>` and `<date_or_time_expr2>` (1 hour = 60 minutes).

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, returns a positive number.
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns a negative number.
- The calculation considers the actual difference and does not ignore seconds or microseconds.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the input datetime includes scale, seconds, or microsecond parts that are non-zero, they are not ignored during calculation.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Minute difference when end time is greater than start time
SELECT MINUTES_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00') AS result;
+--------+
| result |
+--------+
|     60 |
+--------+

-- Includes scale, calculation does not ignore it
SELECT MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923');
+--------------------------------------------------------------------+
| MINUTES_DIFF('2020-12-25 21:00:00.999', '2020-12-25 22:00:00.923') |
+--------------------------------------------------------------------+
|                                                                -59 |
+--------------------------------------------------------------------+

-- End time is earlier than start time, returns negative number
SELECT MINUTES_DIFF('2023-07-13 21:50:00', '2023-07-13 22:00:00') AS result;
+--------+
| result |
+--------+
|    -10 |
+--------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_DIFF('2023-07-14', '2023-07-13') AS result;
+--------+
| result |
+--------+
|   1440 |
+--------+

-- Two times have different seconds, seconds are also calculated
SELECT MINUTES_DIFF('2023-07-13 22:30:59', '2023-07-13 22:31:01') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_DIFF(NULL, '2023-07-13 22:00:00'), MINUTES_DIFF('2023-07-13 22:00:00', NULL) AS result;
+-------------------------------------------+--------+
| MINUTES_DIFF(NULL, '2023-07-13 22:00:00') | result |
+-------------------------------------------+--------+
|                                      NULL |   NULL |
+-------------------------------------------+--------+
```
