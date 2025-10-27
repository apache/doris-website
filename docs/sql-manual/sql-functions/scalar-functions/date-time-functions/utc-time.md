---
{
    "title": "UTC_TIME",
    "language": "en"
}
---

## Description
The UTC_TIME function returns the current time in the UTC timezone. This function is not affected by the local timezone and always returns the current time based on the UTC timezone, ensuring time consistency across different timezone scenarios.

This function behaves consistently with the [utc_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time) in MySQL.

## Syntax

```sql
UTC_TIME([<`precision`>])
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<precision>` | The precision of the returned time value supports integer types within the range [0, 6]. Only integer type constants are accepted.。 |

## Return Value
Returns the current UTC time.

According to different usage scenarios, the return type may be TIME type (format: HH:mm:ss) or integer type (indicating the time elapsed since 00:00:00, in microseconds).

## Examples

```sql
-- Assume the current local time is UTC+8 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
------------+----------------+-----------------+-----------------+
| UTC_TIME() | UTC_TIME() + 1 | UTC_TIME(6)     | UTC_TIME(6) + 1 |
+------------+----------------+-----------------+-----------------+
| 06:39:01   |    23941000001 | 06:39:01.934119 |     23941934120 |
+------------+----------------+-----------------+-----------------+
```

```sql
SELECT UTC_TIME(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6
```
