---
{
    "title": "TIME_TO_SEC",
    "language": "en"
}
---

## Description

The TIME_TO_SEC function converts an input time value to the total number of seconds. This function supports processing TIME and DATETIME types: if the input is DATETIME type, it automatically extracts the time portion (HH:MM:SS) for calculation; if the input is a pure time value, it directly converts to total seconds.

This function behaves consistently with the [time_to_sec function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_time-to-sec) in MySQL.

## Syntax

```sql
TIME_TO_SEC(<date_or_time_expr>)
```

## Parameters

| Parameter             | Description                                                                                                                                                                                                                                                                                                                                                     |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<date_or_time_expr>` | Required. Supports TIME or DATETIME. If the input is DATETIME type, the function extracts the time portion for calculation. For specific datetime/time formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|

## Return Value

Returns an INT type representing the total seconds corresponding to the input time value, calculated as: hours×3600 + minutes×60 + seconds.

- When entering a datetime string, you must explicitly convert it to a datetime type; otherwise, it will be converted to a time type by default, and NULL will be returned.
- If the input is negative time (such as -01:30:00), returns the corresponding negative seconds (such as -5400)
- If the input is NULL, returns NULL
- Ignores the microsecond portion (e.g., 12:34:56.789 is calculated as 12:34:56 only)

## Examples

```sql
-- Pure time type
SELECT TIME_TO_SEC('16:32:18') AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Process the DATETIME string and return NULL.
SELECT TIME_TO_SEC('2025-01-01 16:32:18') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- A datetime string needs to be explicitly converted to a datetime type.
SELECT TIME_TO_SEC(cast('2025-01-01 16:32:18' as datetime)) AS result;
+--------+
| result |
+--------+
|  59538 |
+--------+

-- Negative time conversion
SELECT TIME_TO_SEC('-02:30:00') AS result;
+--------+
| result |
+--------+
|  -9000 |
+--------+

-- Negative time with microseconds (ignore microseconds)
SELECT TIME_TO_SEC('-16:32:18.99') AS result;
+--------+
| result |
+--------+
| -59538 |
+--------+

-- Microsecond processing (ignore microseconds)
SELECT TIME_TO_SEC('10:15:30.123456') AS result;
+--------+
| result |
+--------+
|  36930 |
+--------+

-- Invalid time
SELECT TIME_TO_SEC('12:60:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Exceeds TIME range
SELECT TIME_TO_SEC('839:00:00') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Parameter is NULL
SELECT TIME_TO_SEC(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```