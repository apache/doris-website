---
{
    "title": "SUB_TIME",
    "language": "en"
}
---

## Description

Subtracts the specified time interval from a date/time or time expression. If the second parameter is negative, it is equivalent to adding the interval to the first parameter.

## Syntax

```sql
SUB_TIME(`<date_or_time_expr>`, `<time>`)
```

## Parameters

| Parameter             | Description |
| ---------------------| ----------- |
| `<date_or_time_expr>`| A valid date expression. Supports input of datetime/date/time types. If the type is date, it will be converted to the start time of the day (00:00:00). For specific datetime/time formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [time conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion). |
| `<time>`             | A valid time expression, representing the time value to be subtracted from `<date_or_time_expr>`. If negative, it means addition. Supports input of time type. |

## Return Value

Returns the result of subtracting `<time>` from `<date_or_time_expr>`. The return type depends on the type of the first parameter:
- If the first parameter is of datetime type, returns datetime type.
- If the first parameter is of time type, returns time type.

Special cases:
- If any input parameter is null, returns null.
- If the first parameter is of time type and the result exceeds the time type range, returns the maximum (or minimum) time value.
- If the first parameter is of datetime type and the result exceeds the datetime type range, an error is thrown.

## Examples

```sql
-- Subtract time when the first parameter is datetime type
SELECT SUB_TIME('2025-09-19 12:00:00', '01:30:00'); 
+---------------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', '01:30:00') |
+---------------------------------------------+
| 2025-09-19 10:30:00                         |
+---------------------------------------------+

-- Subtract time when the first parameter is time type
SELECT SUB_TIME(cast('12:15:20' as time), '00:10:40'); 
+------------------------------------------------+
| SUB_TIME(cast('12:15:20' as time), '00:10:40') |
+------------------------------------------------+
| 12:04:40                                       |
+------------------------------------------------+   
         
-- NULL parameter test
SELECT SUB_TIME(NULL, '01:00:00');
+----------------------------+
| SUB_TIME(NULL, '01:00:00') |
+----------------------------+
| NULL                       |
+----------------------------+    

SELECT SUB_TIME('2025-09-19 12:00:00', NULL); 
+---------------------------------------+
| SUB_TIME('2025-09-19 12:00:00', NULL) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

SELECT SUB_TIME(NULL, NULL);
+----------------------+
| SUB_TIME(NULL, NULL) |
+----------------------+
| NULL                 |
+----------------------+                        

-- Time type out-of-range test (returns max/min value)
SELECT SUB_TIME(cast('835:30:00' as time), '-21:00:00');
+--------------------------------------------------+
| SUB_TIME(cast('835:30:00' as time), '-21:00:00') |
+--------------------------------------------------+
| 838:59:59                                        |
+--------------------------------------------------+

SELECT SUB_TIME(cast('-832:30:00' as time), '31:00:00');   
+---------------------------------------------------+
| SUB_TIME(cast('-832:30:00' as time), '31:00:00') |
+---------------------------------------------------+
| -838:59:59                                        |
+---------------------------------------------------+       

-- Datetime type out-of-range test (throws error)
SELECT SUB_TIME('0000-01-01 00:00:00', '00:00:01');  
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time

SELECT SUB_TIME('9999-12-31 23:59:59', '-00:00:01');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]datetime value is out of range in function sub_time
```
