---
{
    "title": "SEC_TO_TIME",
    "language": "en",
    "description": "The SECTOTIME function converts a numeric value in seconds to TIME type,The return format is HH:MM:SS or HH:MM:SS.ssssss."
}
---

## Description

The SEC_TO_TIME function converts a numeric value in seconds to TIME type,The return format is HH:MM:SS or HH:MM:SS.ssssss. The input seconds represent the time calculated from the starting point of a day (00:00:00.000000), supporting positive and negative seconds as well as time ranges exceeding one day.

This function is consistent with the [sec_to_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time) in MySQL.

## Syntax

```sql
SEC_TO_TIME(<seconds>)
```

## Parameters

| Parameter   | Description                                                                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<seconds>` | Required. The input number of seconds, representing the seconds calculated from the start of a day (00:00:00). Supports positive or negative integer types. |

## Return Value

Returns a TIME type value converted from seconds.
- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3023999 to 3023999), returns TIME max or min value
- If the input is NULL, returns NULL
- if the input is an integer, the return format is HH:MM:SS; if the input is a floating-point number, the return format is HH:MM:SS.ssssss.

## Examples

```sql
-- Positive seconds (time within the day)
SELECT SEC_TO_TIME(59738) AS result;
+----------+
| result   |
+----------+
| 16:35:38 |
+----------+

-- Seconds exceeding one day (automatically converted to multiple hours)
SELECT SEC_TO_TIME(90061) AS result;
+----------+
| result   |
+----------+
| 25:01:01 |
+----------+

-- Negative seconds (time from previous day)
SELECT SEC_TO_TIME(-3600) AS result;
+----------+
| result   |
+----------+
| -01:00:00 |
+----------+

-- Zero seconds (start time)
SELECT SEC_TO_TIME(0) AS result;
+----------+
| result   |
+----------+
| 00:00:00 |
+----------+

-- Decimal seconds
SELECT SEC_TO_TIME(3661.9) AS result;
+-----------------+
| result          |
+-----------------+
| 01:01:01.900000 |
+-----------------+

-- Input is NULL (returns NULL)
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3023999 to 3023999), returns TIME max or min value
 SELECT SEC_TO_TIME(30245000) AS result;
+-----------+
| result    |
+-----------+
| 838:59:59 |
+-----------+

SELECT SEC_TO_TIME(-30245000) AS result;
+------------+
| result     |
+------------+
| -838:59:59 |
+------------+
```