---
{
    "title": "MONTHS_BETWEEN",
    "language": "en",
    "description": "Unlike the MONTHSDIFF function, the MONTHSBETWEEN function does not ignore the day component and returns a floating-point number representing the "
}
---

## Description

Unlike the [MONTHS_DIFF function](./months-diff), the MONTHS_BETWEEN function does not ignore the day component and returns a floating-point number representing the actual difference in months, rather than the simple difference in month units displayed on the date.

The MONTHS_BETWEEN function is used to calculate the month difference between two datetime values, returning a floating-point result. This function supports processing DATE and DATETIME types and can control whether the result is rounded through an optional parameter.

This function behaves consistently with Oracle's [MONTHS_BETWEEN function](https://docs.oracle.com/cd/E11882_01/olap.112/e23381/row_functions042.htm#OLAXS434).

## Syntax

```sql
MONTHS_BETWEEN(`<date_or_time_expr1>`, `<date_or_time_expr2>` [, `<round_type>`])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | End date. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | Start date. Supports date/datetime types and strings that conform to datetime formats. |
| `<round_type>` | Whether to round the result to the 8th decimal place. Supports `true` or `false`. Default is `true`. |

## Return Value

Returns the number of months obtained by subtracting `<date_or_time_expr2>` from `<date_or_time_expr1>`, of type DOUBLE.

Result = (`<date_or_time_expr1>`.year - `<date_or_time_expr2>`.year) * 12 + `<date_or_time_expr1>`.month - `<date_or_time_expr2>`.month + (`<date_or_time_expr1>`.day - `<date_or_time_expr2>`.day) / 31.0

- When `<date_or_time_expr1>` or `<date_or_time_expr2>` is NULL, or both are NULL, returns NULL
- When `<round_type>` is true, the result is rounded to the 8th decimal place; otherwise, it maintains DOUBLE precision (15 decimal places)
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns a negative value
- Time components (hours, minutes, seconds) do not affect the calculation; only date components (year, month, day) are used

When `<date_or_time_expr1>` and `<date_or_time_expr2>` meet the following conditions, the function returns an integer month difference (ignoring fractional parts caused by day differences):

- Both dates are the last day of their respective months (e.g., 2024-01-31 and 2024-02-29)
- Both dates have the same day component (e.g., 2024-01-15 and 2024-03-15)

## Examples

```sql
--- Month difference between two dates
SELECT MONTHS_BETWEEN('2020-12-26', '2020-10-25') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Including time components (does not affect result)
SELECT MONTHS_BETWEEN('2020-12-26 15:30:00', '2020-10-25 08:15:00') AS result;
+------------+
| result     |
+------------+
| 2.03225806 |
+------------+

--- Disable rounding (preserve original precision)
SELECT MONTHS_BETWEEN('2020-10-25', '2020-12-26', false) AS result;
+---------------------+
| result              |
+---------------------+
| -2.032258064516129  |
+---------------------+

--- Both are month-end dates (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-31') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Same day component (special handling, returns integer)
SELECT MONTHS_BETWEEN('2024-03-15', '2024-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Different day components and not month-end
SELECT MONTHS_BETWEEN('2024-02-29', '2024-01-30') AS result;
+------------+
| result     |
+------------+
| 0.96774194 |
+------------+

--- Input is NULL (returns NULL)
SELECT MONTHS_BETWEEN(NULL, '2024-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
