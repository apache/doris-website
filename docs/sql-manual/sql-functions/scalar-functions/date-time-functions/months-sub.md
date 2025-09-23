---
{
    "title": "MONTHS_SUB",
    "language": "en"
}
---

## Description

The MONTHS_SUB function subtracts a specified number of months from the input datetime value and returns the resulting new datetime value. This function supports processing DATE and DATETIME types. If a negative number is input, it is equivalent to adding the corresponding number of months.

This function behaves the same as [date_sub function](./date-sub) and MySQL's [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_sub) when using MONTH as the unit.

## Syntax

```sql
MONTHS_SUB(`<date_or_time_expr>`, `<nums>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The date value from which to subtract months. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<nums>` | The number of months to subtract, of type INT. Positive numbers indicate subtracting nums months from the datetime, negative numbers indicate adding nums months. |

## Return Value

Returns a value of the same type as the input `<date_or_time_expr>` (DATE or DATETIME), representing the result of subtracting the specified months from the base time.

- If `<nums>` is negative, the function behaves the same as adding the corresponding months to the base time (i.e., MONTHS_SUB(date, -n) is equivalent to MONTHS_ADD(date, n)).
- If the input is of DATE type (only includes year, month, and day), the result remains of DATE type; if the input is of DATETIME type, the result preserves the original time component (e.g., '2023-03-01 12:34:56' becomes '2023-02-01 12:34:56' after subtracting 1 month).
- If the input date is the last day of the month and the target month has fewer days than that date, it automatically adjusts to the last day of the target month (e.g., March 31st minus 1 month becomes February 28th or 29th, depending on whether it's a leap year).
- If the calculation result exceeds the valid range of the date type (DATE type: 0000-01-01 to 9999-12-31; DATETIME type: 0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns an error.
- If any parameter is NULL, returns NULL.

## Examples

```sql
--- Subtract months from DATE type
SELECT MONTHS_SUB('2020-01-31', 1) AS result;
+------------+
| result     |
+------------+
| 2019-12-31 |
+------------+

--- Subtract months from DATETIME type (preserves time component)
SELECT MONTHS_SUB('2020-01-31 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2019-12-31 02:02:02 |
+---------------------+

--- Negative months (equivalent to addition)
SELECT MONTHS_SUB('2020-01-31', -1) AS result;
+------------+
| result     |
+------------+
| 2020-02-29 |
+------------+

--- Non-end-of-month date subtracting months (direct decrement)
SELECT MONTHS_SUB('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-02-13 22:28:18 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT MONTHS_SUB('2023-10-13 22:28:18.456789', 3) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT MONTHS_SUB(NULL, 5), MONTHS_SUB('2023-07-13', NULL) AS result;
+----------------------+--------+
| months_sub(NULL, 5)  | result |
+----------------------+--------+
| NULL                 | NULL   |
+----------------------+--------+

--- Calculation result exceeds date range
mysql> SELECT MONTHS_SUB('0000-01-01', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 0000-01-01, -1 out of range

mysql> SELECT MONTHS_SUB('9999-12-31', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation months_add of 9999-12-31, 1 out of range
```