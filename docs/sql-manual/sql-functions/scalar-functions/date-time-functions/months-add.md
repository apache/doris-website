---
{
    "title": "MONTHS_ADD",
    "language": "en"
}
---

## Description

The MONTHS_ADD function adds a specified number of months to the input datetime value and returns the resulting new datetime value. This function supports processing DATE and DATETIME types. If a negative number is input, it is equivalent to subtracting the corresponding number of months.

This function is consistent with [date_add function](./date-add) and MySQL's [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) when using MONTH as the unit.

## Syntax

```sql
MONTHS_ADD(`<date_or_time_expr>`, `<nums>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<nums>` | The number of months to add or subtract, of type INT. Negative numbers indicate subtracting nums months from the datetime, positive numbers indicate adding nums months. |

## Return Value

Returns a value of the same type as the input `<date_or_time_expr>` (DATE or DATETIME), representing the result of adding the specified months to the base time.

- If `<nums>` is negative, the function behaves the same as subtracting the corresponding months from the base time (i.e., MONTHS_ADD(date, -n) is equivalent to MONTHS_SUB(date, n)).
- If the input is of DATE type (only includes year, month, and day), the result remains of DATE type; if the input is of DATETIME type, the result preserves the original time component (e.g., '2023-01-01 12:34:56' becomes '2023-02-01 12:34:56' after adding 1 month).
- If the input date is the last day of the month and the target month has fewer days than that date, it automatically adjusts to the last day of the target month (e.g., January 31st plus 1 month becomes February 28th or 29th, depending on whether it's a leap year).
- If the calculation result exceeds the valid range of the date type (DATE type: 0000-01-01 to 9999-12-31; DATETIME type: 0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns an error.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Add months to DATE type
SELECT MONTHS_ADD('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

-- Add months to DATETIME type (preserves time component)
SELECT MONTHS_ADD('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-29 02:02:02 |
+---------------------+

-- Negative months (equivalent to subtraction)
SELECT MONTHS_ADD('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

-- Non-end-of-month date adding months (direct accumulation)
SELECT MONTHS_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-12-13 22:28:18 |
+---------------------+

-- DATETIME with microseconds (preserves precision)
SELECT MONTHS_ADD('2023-07-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-13 22:28:18.456789 |
+----------------------------+

-- Returns NULL when input is NULL
SELECT MONTHS_ADD(NULL, 5), MONTHS_ADD('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_add(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

-- Calculation result exceeds date range
SELECT MONTHS_ADD('9999-12-31', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 9999-12-31, 1 out of range

SELECT MONTHS_ADD('0000-01-01', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 0000-01-01, -1 out of range
```