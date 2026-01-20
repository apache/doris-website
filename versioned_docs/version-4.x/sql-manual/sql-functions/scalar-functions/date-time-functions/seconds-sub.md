---
{
    "title": "SECONDS_SUB",
    "language": "en",
    "description": "The SECONDSSUB function subtracts or adds a specified number of seconds to a specified datetime value and returns the calculated datetime value."
}
---

## Description

The SECONDS_SUB function subtracts or adds a specified number of seconds to a specified datetime value and returns the calculated datetime value. This function supports processing DATE, DATETIME and TIMESTAMPTZ types. If a negative number is input, it is equivalent to adding the corresponding number of seconds.

This function is consistent with [date_sub function](./date-sub) and MySQL's [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) when using SECOND as the unit.

## Syntax

```sql
SECONDS_SUB(<date_or_time_expr>, <seconds>)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | Required. The input datetime value. Can be of type DATE, DATETIME or TIMESTAMPTZ. For specific formats, see [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<seconds>` | Required. The number of seconds to subtract or add. Supports integer type (BIGINT). Positive numbers indicate subtracting seconds, negative numbers indicate adding seconds. |

## Return Value

Returns the value of the base time `<date_or_time_expr>` minus the specified number of seconds `<second>`, and the return type is determined by the type of the first parameter:
- If the type of the first parameter is DATE/DATETIME, it returns a DATETIME type.
- If the type of the first parameter is TIMESTAMPTZ, it returns a TIMESTAMPTZ type.
  
Special cases:
- If `<seconds>` is negative, the function behaves the same as adding the corresponding seconds to the base time (i.e., SECONDS_SUB(date, -n) is equivalent to SECONDS_ADD(date, n)).
- If the input is DATE type (only contains year, month, day), its time portion defaults to 00:00:00.
- If the calculation result exceeds the valid range of the date type (for DATE type: throws an exception).
- If any parameter is NULL, returns NULL.

## Examples

```sql
--- Subtract seconds from DATETIME type
SELECT SECONDS_SUB('2025-01-23 12:34:56', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:26 |
+---------------------+

--- Add seconds to DATETIME type (using negative number)
SELECT SECONDS_SUB('2025-01-23 12:34:56', -30) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:35:26 |
+---------------------+

--- Subtract seconds across minute boundary
SELECT SECONDS_SUB('2023-07-14 00:00:10', 15) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 23:59:55 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT SECONDS_SUB('2023-01-01', 3600) AS result;  -- Subtract 1 hour (3600 seconds)
+---------------------+
| result              |
+---------------------+
| 2022-12-31 23:00:00 |
+---------------------+

--- DATETIME with microseconds (preserves precision)
SELECT SECONDS_SUB('2023-07-13 10:30:25.123456', 2) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 10:30:23.123456 |
+----------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-------------------------------------------------+
| SECONDS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-------------------------------------------------+
| 2025-10-10 12:22:32.123+08:00                   |
+-------------------------------------------------+

--- Returns NULL when input is NULL
SELECT SECONDS_SUB(NULL, 30), SECONDS_SUB('2025-01-23 12:34:56', NULL) AS result;
+-------------------------+--------+
| seconds_sub(NULL, 30)   | result |
+-------------------------+--------+
| NULL                    | NULL   |
+-------------------------+--------+

--- Calculation result exceeds date range
SELECT SECONDS_SUB('0000-01-01 00:00:00', 1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation seconds_add of 0000-01-01 00:00:00, -1 out of range
```