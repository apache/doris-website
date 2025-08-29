---
{
    "title": "SEC_TO_TIME",
    "language": "en"
}
---

## Description

The SEC_TO_TIME function converts a numeric value in seconds to TIME type, returning the format HH:MM:SS. This function parses the input seconds as a time offset calculated from the start of a day (00:00:00), supporting positive and negative seconds as well as time ranges exceeding one day.

This function behaves consistently with the [sec_to_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_sec-to-time) in MySQL.

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
- If the input seconds exceed the valid range of TIME type (-838:59:59 to 838:59:59, corresponding to seconds range -3023999 to 3023999), returns an error
- If the input is NULL, returns NULL
- If the input is a decimal, it will be automatically truncated to an integer (e.g., 3661.9 is processed as 3661)

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

-- Decimal seconds (automatically truncated)
SELECT SEC_TO_TIME(3661.9) AS result;
+----------+
| result   |
+----------+
| 01:01:01 |
+----------+

-- Input is NULL (returns NULL)
SELECT SEC_TO_TIME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Exceeds TIME type range, returns error
SELECT SEC_TO_TIME(30245000) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]The function SEC_TO_TIME Argument value 30245000 is out of Time range
```