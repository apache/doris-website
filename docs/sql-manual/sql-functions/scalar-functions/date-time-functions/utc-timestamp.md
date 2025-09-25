---
{
    "title": "UTC_TIMESTAMP",
    "language": "en"
}
---

## Description
The UTC_TIMESTAMP function returns the current date and time in UTC timezone. This function is not affected by local timezone and always returns the current time based on UTC timezone, ensuring time consistency across different timezone scenarios.

This function behaves consistently with the [utc_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) in MySQL.

## Syntax

```sql
UTC_TIMESTAMP()
```

## Return Value
Returns the current UTC date and time, type DATETIME.

## Examples

```sql
-- Current local time is UTC+8 2025-08-14 11:45:42
SELECT UTC_TIMESTAMP() AS utc_str;
+---------------------+
| utc_str             |
+---------------------+
| 2025-08-14 03:45:42 |
+---------------------+
```
