---
{
    "title": "ADD_TIME",
    "language": "en",
    "description": "Adds the specified time interval to a date/time or time expression. If the second parameter is negative,"
}
---

## Description

Adds the specified time interval to a date/time or time expression. If the second parameter is negative, it is equivalent to subtracting the interval from the first parameter.

## Syntax

```sql
ADD_TIME(`<date_or_time_expr>`, `<time>`)
```

## Parameters

| Parameter             | Description |
| ---------------------| ----------- |
| `<date_or_time_expr>`| A valid date expression. Supports input of timestamptz/datetime/date/time types. If the type is date, it will be converted to the start time of the day (00:00:00). For specific formats, see [timestamptz conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [time conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion). |
| `<time>`             | A valid time expression, representing the time value to be added to `<date_or_time_expr>`. If negative, it means subtraction. Supports input of time type. |

## Return Value

Returns the result of adding `<time>` to `<date_or_time_expr>`. The return type depends on the type of the first parameter:
- If the first parameter is of timestamptz type, returns timestamptz type.
- If the first parameter is of datetime type, returns datetime type.
- If the first parameter is of time type, returns time type.

Special cases:
- If any input parameter is null, returns null.
- If the first parameter is of time type and the result exceeds the time type range, returns the maximum (or minimum) time value.
- If the first parameter is of datetime or timestamptz type and the result exceeds the datetime type range, an error is thrown.

## Examples

```sql
-- Add time when the first parameter is datetime type
SELECT ADD_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 13:30:00                         |
+---------------------------------------------+

-- Add time when the first parameter is time type
SELECT ADD_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| ADD_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:26:00                                       |
+------------------------------------------------+   

-- SET time_zone = '+08:00';
SELECT ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03');
+-----------------------------------------------------------+
| ADD_TIME('2025-10-10 11:22:33.1234567+03:00', '01:02:03') |
+-----------------------------------------------------------+
| 2025-10-10 17:24:36.123457+08:00                          |
+-----------------------------------------------------------+
         
-- NULL parameter test
SELECT ADD_TIME(NULL, '01:00:00');
+----------------------------+
| ADD_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT ADD_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| ADD_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT ADD_TIME(NULL, NULL);
+----------------------+
| ADD_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT ADD_TIME(cast('835:30:00' as time), '21:00:00'); 
+-------------------------------------------------+
| ADD_TIME(cast('835:30:00' as time), '21:00:00') |
+-------------------------------------------------+
| 838:59:59                                       |
+-------------------------------------------------+

SELECT ADD_TIME(cast('-832:30:00' as time), '-31:00:00');   
+---------------------------------------------------+
| ADD_TIME(cast('-832:30:00' as time), '-31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT ADD_TIME('9999-12-31 23:59:59', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time

SELECT ADD_TIME('0000-01-01 00:00:00', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function add_time
```
