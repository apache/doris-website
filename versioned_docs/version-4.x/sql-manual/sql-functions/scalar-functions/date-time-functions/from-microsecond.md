---
{
    "title": "FROM_MICROSECOND",
    "language": "en"
}
---
## Description

The FROM_MICROSECOND function is used to convert a Unix timestamp (in microseconds) to a `DATETIME` type date-time value. The reference time for Unix timestamps is 1970-01-01 00:00:00 UTC, and this function converts the input microseconds to the corresponding specific date and time after that reference time (including the fractional part of seconds, accurate to microseconds).

## Syntax

```sql
FROM_MICROSECOND(<unix_timestamp>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<unix_timestamp>` | Input Unix timestamp, of integer type (BIGINT), representing the number of microseconds from 1970-01-01 00:00:00 UTC |

## Return Value

Returns a DATETIME type value representing the result of converting the UTC timezone unix timestamp to the current timezone time
- If <unix_timestamp> is NULL, the function returns NULL.
- If the input <unix_timestamp> can be converted to integer seconds, the result returns datetime without scale; if not, the result returns datetime with scale
- If <unix_timestamp> is less than 0, returns an error
- If the returned datetime exceeds the maximum time 9999-12-31 23:59:59, returns an error

## Examples

```sql

-- Current machine is in East 8th timezone, so the returned time is 8 hours ahead of UTC
SELECT FROM_MICROSECOND(0);
+----------------------------+
| FROM_MICROSECOND(0)        |
+----------------------------+
| 1970-01-01 08:00:00.000000 |
+----------------------------+

-- Convert 1700000000000000 microseconds added to reference time to datetime
SELECT FROM_MICROSECOND(1700000000000000);

+------------------------------------+
| from_microsecond(1700000000000000) |
+------------------------------------+
| 2023-11-15 06:13:20                |
+------------------------------------+

-- Timestamp contains non-integer seconds (1700000000 seconds + 123456 microseconds)
select from_microsecond(1700000000123456) as dt_with_micro;

+----------------------------+
| dt_with_micro              |
+----------------------------+
| 2023-11-15 06:13:20.123456 |
+----------------------------+

-- Input negative number, returns error
 select from_microsecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of -1 out of range


-- Input NULL, returns NULL
select from_microsecond(NULL);
+------------------------+
| from_microsecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

-- Exceeds maximum time range 9999-12-31 23:59:59, returns error
select from_microsecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_microsecond of 999999999999999999 out of range
```