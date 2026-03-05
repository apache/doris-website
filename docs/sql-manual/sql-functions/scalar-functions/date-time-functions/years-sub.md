---
{
    "title": "YEARS_SUB",
    "language": "en",
    "description": "The YEARSSUB function is used to subtract (or add) a specified number of years from a given date or time value,"
}
---

## Description

The YEARS_SUB function is used to subtract (or add) a specified number of years from a given date or time value, returning the adjusted date or time (essentially subtracting years_value × 1 year). It supports processing DATE and DATETIME types, where the number of years can be positive (subtraction) or negative (addition). This function supports DATE, DATETIME and TIMESTAMPTZ input types.

This function behaves consistently with the [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) using YEAR as the unit in MySQL.

## Syntax

```sql
YEARS_SUB(`<date_or_time_expr>`, `<years>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime/timestamptz types. For specific formats, please refer to [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)  |
| `<years>` | Number of years to subtract, type INT, positive numbers indicate subtraction, negative numbers indicate addition |

## Return Value

Returns a result consistent with the input type (DATE or DATETIME or TIMESTAMPTZ), representing the adjusted date or time, the return value type is determined by the type of the first parameter:

- If input is DATE type, return value is DATE type (only adjusts year, month, day).
- If input is DATETIME type, return value is DATETIME type (year, month, day adjusted, hours, minutes, seconds remain unchanged).
- If input is TIMESTAMPTZ type, return value is TIMESTAMPTZ type (includes date, time and timezone offset).
- `<years_value>` as negative number indicates adding years (equivalent to YEARS_ADD(`<datetime_or_date_value>`, `<years_value>`)).
- Any input parameter is NULL, returns NULL.
- If calculation result exceeds valid date type range (0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns error.
- If the adjusted month has insufficient days (e.g., from leap year February 29th subtract 1 year to non-leap year February 28th), automatically adjusts to the actual number of days in that month.

## Examples

```sql
-- DATETIME type subtract 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_SUB('2020-02-02 02:02:02', 1) AS sub_1_year_datetime;
+---------------------+
| sub_1_year_datetime |
+---------------------+
| 2019-02-02 02:02:02 |
+---------------------+

-- DATETIME type add 1 year (negative years_value, cross-year)
SELECT YEARS_SUB('2022-05-10 15:40:20', -1) AS add_1_year_datetime;
+---------------------+
| add_1_year_datetime |
+---------------------+
| 2023-05-10 15:40:20 |
+---------------------+

-- DATE type subtract 3 years (only adjust date)
SELECT YEARS_SUB('2022-12-25', 3) AS sub_3_year_date;
+-----------------+
| sub_3_year_date |
+-----------------+
| 2019-12-25      |
+-----------------+

-- Leap day handling (from leap year February 29th subtract 1 year to non-leap year February 28th)
SELECT YEARS_SUB('2020-02-29', 1) AS leap_day_adjust_1;
+-------------------+
| leap_day_adjust_1 |
+-------------------+
| 2019-02-28        |
+-------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| YEARS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2024-10-10 12:22:33.123+08:00                 |
+-----------------------------------------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 9999-12-31, 1 out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_add of 0000-01-01, -1 out of range
```
