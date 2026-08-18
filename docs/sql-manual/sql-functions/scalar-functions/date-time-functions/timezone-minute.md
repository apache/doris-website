---
{
    "title": "TIMEZONE_MINUTE",
    "language": "en",
    "description": "Returns the minute part of the time zone offset of a TIMESTAMPTZ value, calculated with respect to the session time zone"
}
---

## Description

Returns the minute part of the time zone offset of the given `TIMESTAMPTZ` value. The offset is calculated between the UTC time and the session time zone at the instant represented by the value, and is negative for time zones west of UTC.

This function is consistent with the [timezone_minute](https://trino.io/docs/current/functions/datetime.html#timezone_minute) function in Trino, except that a `TIMESTAMPTZ` value in Doris does not carry a time zone, so the session time zone is used. For the `TIMESTAMPTZ` data type, please refer to [TIMESTAMPTZ](../../../../sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ). For time zone settings, please refer to [Time Zone Management](../../../../admin-manual/cluster-management/time-zone).

## Syntax

```sql
TIMEZONE_MINUTE(<timestamp>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<timestamp>` | The `TIMESTAMPTZ` value whose time zone offset minute is to be returned |

## Return Value

Returns the minute part of the time zone offset as a value of type `BIGINT`. The offset is computed in the session time zone at the instant represented by the value. For time zones with a whole-hour offset, the returned value is 0.

- If the parameter is NULL, returns NULL.

## Example

```sql
-- The Asia/Shanghai time zone is UTC+8, so the minute part is 0
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+---------------------------------------------------------------+
| timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+---------------------------------------------------------------+
|                                                             0 |
+---------------------------------------------------------------+

-- The offset of Asia/Kathmandu is UTC+05:45, so the minute part is 45
mysql> SET time_zone = 'Asia/Kathmandu';
mysql> SELECT timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+---------------------------------------------------------------+
| timezone_minute(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+---------------------------------------------------------------+
|                                                            45 |
+---------------------------------------------------------------+

-- A TIMESTAMPTZ value stores only the UTC instant, not the input zone, so
-- even when the input carries '-04:30', the returned offset is the session
-- time zone's offset. Trino would return -30 for this input.
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_minute(CAST('2024-01-15 12:00:00-04:30' AS TIMESTAMPTZ));
+----------------------------------------------------------------------+
| timezone_minute(CAST('2024-01-15 12:00:00-04:30' AS TIMESTAMPTZ))    |
+----------------------------------------------------------------------+
|                                                                    0 |
+----------------------------------------------------------------------+

-- When the input is NULL, returns NULL
mysql> SELECT timezone_minute(CAST(NULL AS TIMESTAMPTZ));
+--------------------------------------------+
| timezone_minute(CAST(NULL AS TIMESTAMPTZ)) |
+--------------------------------------------+
|                                       NULL |
+--------------------------------------------+
```
