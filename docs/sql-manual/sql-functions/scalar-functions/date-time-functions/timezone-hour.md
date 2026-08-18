---
{
    "title": "TIMEZONE_HOUR",
    "language": "en",
    "description": "Returns the hour part of the time zone offset of a TIMESTAMPTZ value, calculated with respect to the session time zone"
}
---

## Description

Returns the hour part of the time zone offset of the given `TIMESTAMPTZ` value. The offset is calculated between the UTC time and the session time zone at the instant represented by the value, and is negative for time zones west of UTC.

This function is consistent with the [timezone_hour](https://trino.io/docs/current/functions/datetime.html#timezone_hour) function in Trino, except that a `TIMESTAMPTZ` value in Doris does not carry a time zone, so the session time zone is used. For the `TIMESTAMPTZ` data type, please refer to [TIMESTAMPTZ](../../../../sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ). For time zone settings, please refer to [Time Zone Management](../../../../admin-manual/cluster-management/time-zone).

## Syntax

```sql
TIMEZONE_HOUR(<timestamp>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<timestamp>` | The `TIMESTAMPTZ` value whose time zone offset hour is to be returned |

## Return Value

Returns the hour part of the time zone offset as a value of type `BIGINT`. The offset is computed in the session time zone at the instant represented by the value.

- If the parameter is NULL, returns NULL.

## Example

```sql
-- The Asia/Shanghai time zone is UTC+8
mysql> SET time_zone = '+08:00';
mysql> SELECT timezone_hour(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ));
+-------------------------------------------------------------+
| timezone_hour(CAST('2024-01-15 12:00:00' AS TIMESTAMPTZ))   |
+-------------------------------------------------------------+
|                                                           8 |
+-------------------------------------------------------------+

-- During daylight saving time, the offset of America/New_York is UTC-4
mysql> SET time_zone = 'America/New_York';
mysql> SELECT timezone_hour(CAST('2024-07-01 12:00:00' AS TIMESTAMPTZ));
+-------------------------------------------------------------+
| timezone_hour(CAST('2024-07-01 12:00:00' AS TIMESTAMPTZ))   |
+-------------------------------------------------------------+
|                                                          -4 |
+-------------------------------------------------------------+

-- When the input is NULL, returns NULL
mysql> SELECT timezone_hour(CAST(NULL AS TIMESTAMPTZ));
+------------------------------------------+
| timezone_hour(CAST(NULL AS TIMESTAMPTZ)) |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```
