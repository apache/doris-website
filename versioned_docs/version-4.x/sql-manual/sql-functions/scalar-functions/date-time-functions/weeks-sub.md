---
{
    "title": "WEEKS_SUB",
    "language": "en",
    "description": "The WEEKSSUB function is used to subtract (or add) a specified number of weeks from a given date or time value,"
}
---

## Description
The WEEKS_SUB function is used to subtract (or add) a specified number of weeks from a given date or time value, returning the adjusted date or time (essentially subtracting weeks_value × 7 days). It supports processing DATE and DATETIME types.

This function is consistent with the [weeks_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weeks-sub) using WEEK as the unit in MySQL.

## Syntax
```sql
WEEKS_SUB(`<date_or_time_expr>`, `<week_period>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `week_period` | INT type integer, representing the number of weeks to subtract (positive for subtraction, negative for addition). |

## Return Value
Returns the date or time with the specified number of weeks subtracted:

- If input is DATE type, return value remains DATE type (only adjusts year, month, day).
- If input is DATETIME type, return value remains DATETIME type (year, month, day adjusted, hours, minutes, seconds remain unchanged).
- `<weeks_value>` as negative number indicates adding weeks (equivalent to WEEKS_ADD(`<datetime_or_date_value>`, `<weeks_value>`)).
- Any input parameter is NULL, returns NULL.
- If calculation result exceeds valid date type range (0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns error.
  
## Examples
```sql
-- DATETIME type subtract 1 week (basic functionality, hours, minutes, seconds remain unchanged)
SELECT WEEKS_SUB('2023-10-01 08:30:45', 1) AS sub_1_week_datetime;
+---------------------+
| sub_1_week_datetime |
+---------------------+
| 2023-09-24 08:30:45 |
+---------------------+

-- DATETIME type add 1 week (negative weeks_value, cross-month)
SELECT WEEKS_SUB('2023-09-24 14:20:10', -1) AS add_1_week_datetime;
+---------------------+
| add_1_week_datetime |
+---------------------+
| 2023-10-01 14:20:10 |
+---------------------+

-- DATE type subtract 2 weeks (only adjust date, no time portion)
SELECT WEEKS_SUB('2023-06-03', 2) AS sub_2_week_date;
+-----------------+
| sub_2_week_date |
+-----------------+
| 2023-05-20      |
+-----------------+

-- Cross-year subtraction (early January minus 1 week, to late December of previous year)
SELECT WEEKS_SUB('2024-01-01', 1) AS cross_year_sub;
+----------------+
| cross_year_sub |
+----------------+
| 2023-12-25     |
+----------------+

-- Input is NULL (returns NULL)
SELECT WEEKS_SUB(NULL, 5) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- The calculation result exceeds the lower bound of the datetime range.
SELECT WEEKS_SUB('0000-01-01', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 0000-01-01, -1 out of range

-- The calculation result exceeds the upper bound of the datetime range.
SELECT WEEKS_SUB('9999-12-31', -1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation weeks_add of 9999-12-31, 1 out of range
```