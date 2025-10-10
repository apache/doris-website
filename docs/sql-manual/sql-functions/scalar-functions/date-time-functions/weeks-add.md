---
{
    "title": "WEEKS_ADD",
    "language": "en"
}
---

## Description 

The WEEKS_ADD function is used to add (or subtract) a specified number of weeks to a given date or time value, equivalent to adding/subtracting seven days to the original date, returning the adjusted date or time.

This function behaves consistently with the [weeks_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-add) using WEEK as the unit in MySQL.

## Syntax
```sql
WEEKS_ADD(`<datetime_or_date_expr>`, `<weeks_value>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<datetime_or_date_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<weeks_value>` | INT type integer, representing the number of weeks to add or subtract (positive for addition, negative for subtraction) |

## Return Value

Returns the datetime with the specified number of weeks added.

- If input is DATE type, return value remains DATE type (only adjusts year, month, day).
- If input is DATETIME type, return value remains DATETIME type (year, month, day adjusted, hours, minutes, seconds remain unchanged).
- `<weeks_value>` as negative number indicates subtracting weeks.
- Any input parameter is NULL, returns NULL
- If calculation result exceeds valid date type range (0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns error

## Examples
```sql
-- DATETIME type add 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_ADD('2023-10-01 08:30:45', 1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-08 08:30:45 |
+---------------------+

-- DATETIME type subtract 1 week (negative weeks, cross-month)
SELECT WEEKS_ADD('2023-10-01 14:20:10', -1) AS subtract_1_week_datetime;
+--------------------------+
| subtract_1_week_datetime |
+--------------------------+
| 2023-09-24 14:20:10      |
+--------------------------+

-- DATE type add 2 weeks (only adjust date, no time portion)
SELECT WEEKS_ADD('2023-05-20', 2) AS add_2_week_date;
+-----------------+
| add_2_week_date |
+-----------------+
| 2023-06-03      |
+-----------------+

-- Cross-year addition (late December plus 1 week, to early January next year)
SELECT WEEKS_ADD('2023-12-25', 1) AS cross_year_add;
+----------------+
| cross_year_add |
+----------------+
| 2024-01-01     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_ADD(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```


