---
{
    "title": "MINUTES_ADD",
    "language": "en"
}
---

## Description

The MINUTES_ADD function adds a specified number of minutes to the input datetime value and returns the resulting new datetime value. This function supports processing DATE and DATETIME types.

This function behaves the same as [date_add function](./date-add) and MySQL's [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) when using MINUTE as the unit.

## Syntax

```sql
MINUTES_ADD(`<date_or_time_expr>`, `<minutes>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value, which can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<minutes>` | The number of minutes to add, of type BIGINT. |

## Return Value

Returns a value of type DATETIME, representing the result of adding the specified minutes to the base time.

- If `<minutes>` is negative, the function behaves the same as subtracting the corresponding minutes from the base time (i.e., MINUTES_ADD(date, -n) is equivalent to MINUTES_SUB(date, n)).
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the input datetime includes microseconds, the original microsecond precision is preserved after adding minutes (e.g., '2023-01-01 00:00:00.123456' becomes '2023-01-01 00:01:00.123456' after adding 1 minute).
- If the calculation result exceeds the valid range of the DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), an exception is thrown.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Add minutes to DATE type (default time 00:00:00)
SELECT MINUTES_ADD('2020-02-02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 00:01:00 |
+---------------------+

-- Add minutes to DATETIME
SELECT MINUTES_ADD('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:33:18 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_ADD('2023-07-13 22:28:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:38:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to subtraction)
SELECT MINUTES_ADD('2023-07-13 22:28:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:23:18 |
+---------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_ADD(NULL, 10), MINUTES_ADD('2023-07-13 22:28:18', NULL) AS result;
+-------------------------+--------+
| minutes_add(NULL, 10)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_add of 9999-12-31 23:59:59, 2 out of range
```
