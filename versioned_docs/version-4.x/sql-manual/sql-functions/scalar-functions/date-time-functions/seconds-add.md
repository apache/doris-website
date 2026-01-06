---
{
    "title": "SECONDS_ADD",
    "language": "en",
    "description": "The SECONDSADD function adds or subtracts a specified number of seconds to a specified datetime value and returns the calculated datetime value."
}
---

## Description

The SECONDS_ADD function adds or subtracts a specified number of seconds to a specified datetime value and returns the calculated datetime value. This function supports processing DATE and DATETIME types. If a negative number is input, it is equivalent to subtracting the corresponding number of seconds.

This function is consistent with [date_add function](./date-add) and MySQL's [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) when using SECOND as the unit.

## Syntax

```sql
SECONDS_ADD(<date_or_time_expr>, <seconds>)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | Required. The input datetime value. Can be of type DATE or DATETIME. For specific datetime/date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<seconds>` | Required. The number of seconds to add or subtract. Supports integer type (BIGINT). Positive numbers indicate adding seconds, negative numbers indicate subtracting seconds. |

## Return Value

Returns a datetime value with the same type as the input `<date_or_time_expr>`.

- If `<seconds>` is negative, the function behaves the same as subtracting the corresponding seconds from the base time (i.e., SECONDS_ADD(date, -n) is equivalent to SECONDS_SUB(date, n)).
- If the input is DATE type (only contains year, month, day), its time portion defaults to 00:00:00.
- If the calculation result exceeds the valid range of the date type (DATE type: 0000-01-01 to 9999-12-31; DATETIME type: 0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), returns an error.
- If any parameter is NULL, returns NULL.

## Examples

```sql
--- Add seconds to DATETIME type
SELECT SECONDS_ADD('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds from DATETIME type (using negative number)
SELECT SECONDS_ADD('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds across minute boundary
SELECT SECONDS_ADD('2023-07-13 23:59:50', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-14 00:00:05 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_ADD('2023-01-01', 3600) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 01:00:00 |
+---------------------+

--- DATETIME with scale (preserves precision)
SELECT SECONDS_ADD('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:27.123456 |
+----------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_ADD(NULL, 30), SECONDS_ADD('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_add(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_ADD('9999-12-31 23:59:59', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 9999-12-31 23:59:59, 2 out of range

select seconds_add('0000-01-01 00:00:30',-31);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:30, -31 out of range
```
