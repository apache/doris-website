---
{
    "title": "FROM_SECOND",
    "language": "en"
}
---

## Description
The FROM_SECOND function is used to convert a Unix timestamp (in seconds) to a DATETIME type date-time value. The reference time for Unix timestamps is 1970-01-01 00:00:00 UTC, and this function converts the input seconds to the corresponding specific date and time after that reference time (accurate to seconds).

## Syntax

```sql
FROM_SECOND(<unix_timestamp>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<unix_timestamp>` | Input Unix timestamp, of integer type (BIGINT), representing the number of seconds from 1970-01-01 00:00:00 UTC. |

## Return Value

- Returns a DATETIME type value representing the result of converting the input UTC timezone unix timestamp to the current timezone time
- If <unix_timestamp> is NULL, the function returns NULL.
- If <unix_timestamp> exceeds the valid range (result datetime exceeds 9999-12-31 23:59:59), the function returns an error.
- Input negative seconds, the function returns an error

## Examples

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
 SELECT FROM_SECOND(0);
+---------------------+
| FROM_SECOND(0)      |
+---------------------+
| 1970-01-01 08:00:00 |
+---------------------+

---Convert 1700000000 seconds to datetime
SELECT FROM_SECOND(1700000000);

+-------------------------+
| from_second(1700000000) |
+-------------------------+
| 2023-11-15 06:13:20     |
+-------------------------+

---Result exceeds maximum date range, returns error
select from_second(999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_second Argument value is out of DateTime range

---Input parameter is NULL, returns NULL
select from_second(NULL);
+-------------------+
| from_second(NULL) |
+-------------------+
| NULL              |
+-------------------+

--Input parameter is negative, result returns error
 select from_second(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation from_second of -1 out of range
```