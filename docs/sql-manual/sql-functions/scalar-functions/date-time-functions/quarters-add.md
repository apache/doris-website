---
{
    "title": "QUARTERS_ADD",
    "language": "en"
}
---

## Description

The QUARTERS_ADD function is used to add or subtract a specified number of quarters (1 quarter = 3 months) to a specified datetime value and returns the calculated datetime value. This function supports processing DATE and DATETIME types. If a negative number is input, it is equivalent to subtracting the corresponding number of quarters.

## Syntax

```sql
QUARTERS_ADD(`<date_or_time_expr>`, `<quarters>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input date or datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<quarters>` | The number of quarters to add or subtract. Positive integers indicate addition, negative integers indicate subtraction. |

## Return Value

Returns a date value consistent with the input date type.
- If `<quarters>` is negative, the function behaves the same as subtracting the corresponding number of quarters from the base time (i.e., QUARTERS_ADD(date, -n) is equivalent to QUARTERS_SUB(date, n)).
- If the input is of DATE type (only includes year, month, and day), the result remains of DATE type; if the input is of DATETIME type, the result preserves the original time component (e.g., '2023-01-01 12:34:56' becomes '2023-04-01 12:34:56' after adding 1 quarter).
- If the input date is the last day of the month and the target month has fewer days than that date, it automatically adjusts to the last day of the target month (e.g., January 31st plus 1 quarter (3 months) becomes April 30th).
- If the calculation result exceeds the valid range of the date type (DATE type: 0000-01-01 to 9999-12-31; DATETIME type: 0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns NULL or throws an exception.
- If any parameter is NULL, returns NULL.

## Examples

```sql
--- Add quarters to DATE type
SELECT QUARTERS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-04-30 |
+------------+

--- Add quarters to DATETIME type (preserves time component)
SELECT QUARTERS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-04-30 02:02:02 |
+---------------------+

--- Negative quarters (equivalent to subtraction)
SELECT QUARTERS_ADD('2020-04-30', -1) AS result;
+------------+
| result     |
+------------+
| 2020-01-30 |
+------------+

--- Non-end-of-month date adding quarters (direct accumulation)
SELECT QUARTERS_ADD('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT QUARTERS_ADD('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

--- Adding quarters across years
SELECT QUARTERS_ADD('2023-10-01', 2) AS result;
+------------+
| result     |
+------------+
| 2024-04-01 |
+------------+

--- Returns NULL when input is NULL
SELECT QUARTERS_ADD(NULL, 1), QUARTERS_ADD('2023-07-13', NULL) AS result;
+-------------------------+--------+
| quarters_add(NULL, 1)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT QUARTERS_ADD('9999-10-31', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 9999-10-31, 2 out of range

SELECT QUARTERS_ADD('0000-01-01',-2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarters_add of 0000-01-01, -2 out of range
```