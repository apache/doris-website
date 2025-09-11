---
{
    "title": "MINUTES_SUB",
    "language": "en"
}
---

## Description

The MINUTES_SUB function subtracts a specified number of minutes from the input datetime value and returns the resulting new datetime value. This function supports processing DATE and DATETIME types.

This function behaves the same as MySQL's [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date_add) when using MINUTE as the unit.

## Syntax

```sql
MINUTES_SUB(`<date_or_time_expr>`, `<minutes>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value, which can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<minutes>` | The number of minutes to subtract, of type BIGINT. Can be positive or negative. |

## Return Value

Returns a value of type DATETIME, representing the datetime value after subtracting the specified number of minutes.

- If `<minutes>` is negative, the function behaves the same as adding the corresponding minutes to the base time (i.e., MINUTES_SUB(date, -n) is equivalent to MINUTES_ADD(date, n)).
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the input datetime includes microseconds, the original microsecond precision is preserved after subtracting minutes (e.g., '2023-01-01 00:01:00.123456' becomes '2023-01-01 00:00:00.123456' after subtracting 1 minute).
- If the calculation result exceeds the valid range of the DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), an exception is thrown.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Subtract minutes from DATETIME
SELECT MINUTES_SUB('2020-02-02 02:02:02', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-02-02 02:01:02 |
+---------------------+

-- Time with microseconds (preserves precision)
SELECT MINUTES_SUB('2023-07-13 22:38:18.456789', 10) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:28:18.456789 |
+----------------------------+

-- Negative minutes (equivalent to addition)
SELECT MINUTES_SUB('2023-07-13 22:23:18', -5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:18 |
+---------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTES_SUB('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-12 23:30:00 |
+---------------------+

-- Any parameter is NULL, returns NULL
SELECT MINUTES_SUB(NULL, 10), MINUTES_SUB('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| MINUTES_SUB(NULL, 10) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+


-- Calculation result exceeds datetime range, throws error
SELECT MINUTES_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minutes_sub of 0000-01-01 00:00:00, 1 out of range
```
