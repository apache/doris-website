---
{
    "title": "YEARS_ADD",
    "language": "en"
}
---

## Description

The YEARS_ADD function is used to add (or subtract) a specified number of years to a given date or time value, returning the adjusted date or time. It supports processing DATE and DATETIME types, where the number of years can be positive (addition) or negative (subtraction).

This function is consistent with the [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) using YEAR as the unit in MySQL.

## Syntax

```sql
YEARS_ADD(`<date_or_time_expr>`, `<years>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<years>` | Number of years to add, type INT, negative numbers indicate subtraction, positive numbers indicate addition |


## Return Value

Returns a result consistent with the input type (DATE or DATETIME), representing the adjusted date or time:

- If input is DATE type, return value remains DATE type (only adjusts year, month, day).
- If input is DATETIME type, return value remains DATETIME type (year, month, day adjusted, hours, minutes, seconds remain unchanged).
- `<years_value>` as negative number indicates subtracting years (equivalent to YEARS_SUB(`<datetime_or_date_value>`, `<years_value>`)).
- Any input parameter is NULL, returns NULL.
- If calculation result exceeds valid date type range (0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns error.
- If the adjusted month has insufficient days (e.g., February 29th plus 1 year and next year is not a leap year), automatically adjusts to the last day of that month (e.g., 2020-02-29 plus 1 year returns 2021-02-28).

## Examples

```sql
-- DATETIME type add 1 year (basic functionality, hours, minutes, seconds remain unchanged)
SELECT YEARS_ADD('2020-01-31 02:02:02', 1) AS add_1_year_datetime;
+-----------------------+
| add_1_year_datetime   |
+-----------------------+
| 2021-01-31 02:02:02   |
+-----------------------+

-- DATETIME type subtract 1 year (negative years_value, cross-year)
SELECT YEARS_ADD('2023-05-10 15:40:20', -1) AS subtract_1_year_datetime;
+--------------------------+
| subtract_1_year_datetime |
+--------------------------+
| 2022-05-10 15:40:20      |
+--------------------------+

-- DATE type add 3 years (only adjust date)
SELECT YEARS_ADD('2019-12-25', 3) AS add_3_year_date;
+------------------+
| add_3_year_date  |
+------------------+
| 2022-12-25       |
+------------------+

-- Leap day handling (2020-02-29 add 1 year, next year is not leap year)
SELECT YEARS_ADD('2020-02-29', 1) AS leap_day_adjust;
+------------------+
| leap_day_adjust  |
+------------------+
| 2021-02-28       |
+------------------+

-- Cross-month day adjustment (January 31st add 1 year to February)
SELECT YEARS_ADD('2023-01-31', 1) AS month_day_adjust;
+------------------+
| month_day_adjust |
+------------------+
| 2024-01-31       |  -- 2024 January has 31 days, no adjustment needed
+------------------+

-- Input is NULL (returns NULL)
SELECT YEARS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Calculation result exceeds datetime range (upper limit)
SELECT YEARS_ADD('9999-12-31', 1);
-- ERROR: Operation out of range

-- Calculation result exceeds datetime range (lower limit)
SELECT YEARS_ADD('0000-01-01', -1);
-- ERROR: Operation out of range
```
