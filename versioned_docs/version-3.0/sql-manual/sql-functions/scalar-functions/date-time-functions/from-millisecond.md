---
{
    "title": "FROM_MILLISECOND",
    "language": "en"
}
---
## Description

The FROM_MILLISECOND function is used to convert a Unix timestamp (in milliseconds) to a DATETIME type date-time value. The reference time for Unix timestamps is 1970-01-01 00:00:00 UTC, and this function converts the input milliseconds to the corresponding specific date and time after that reference time (accurate to milliseconds).

## Syntax

```sql
FROM_MILLISECOND(<millisecond>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<millisecond>` | Input Unix timestamp, of integer type (BIGINT), representing the number of milliseconds from 1970-01-01 00:00:00 UTC. |

## Return Value

Returns a DATETIME type value representing the result of converting the input UTC timezone unix timestamp to the current timezone time
- If millisecond is NULL, the function returns NULL.
- If millisecond exceeds the valid range (result datetime exceeds 9999-12-31 23:59:59), the function returns an error.
- If the input millisecond can be converted to integer seconds, the result returns datetime without scale; if not, the result returns datetime with scale
- Input negative number, result returns error

## Examples

```sql

----Since the current machine is in East 8th timezone, the returned time is 8 hours ahead of UTC
SELECT FROM_MILLISECOND(0);
+-------------------------+
| FROM_MILLISECOND(0)     |
+-------------------------+
| 1970-01-01 08:00:00.000 |
+-------------------------+

-- Convert 1700000000000 milliseconds to datetime
SELECT FROM_MILLISECOND(1700000000000);

+---------------------------------+
| from_millisecond(1700000000000) |
+---------------------------------+
| 2023-11-15 06:13:20             |
+---------------------------------+

-- Timestamp contains non-zero milliseconds (1700000000 seconds + 123 milliseconds)
select from_millisecond(1700000000123) as dt_with_milli;

+----------------------------+
| dt_with_milli              |
+----------------------------+
| 2023-11-15 06:13:20.123000 |
+----------------------------+

---Input is NULL, result returns NULL
select from_millisecond(NULL);
+------------------------+
| from_millisecond(NULL) |
+------------------------+
| NULL                   |
+------------------------+

---Input is negative, result returns error
 select from_millisecond(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_millisecond Argument value must be non-negative

--Result exceeds maximum date, returns error
select from_millisecond(999999999999999999);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INTERNAL_ERROR]The function from_millisecond Argument value is out of DateTime range
```

