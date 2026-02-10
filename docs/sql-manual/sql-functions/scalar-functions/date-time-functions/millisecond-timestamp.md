---
{
    "title": "MILLISECOND_TIMESTAMP",
    "language": "en",
    "description": "The MILLISECONDTIMESTAMP function converts the input datetime value into a Unix timestamp calculated from 1970-01-01 00:00:00 (adjusted by the local "
}
---

## Description

The `MILLISECOND_TIMESTAMP` function converts the input datetime value into a Unix timestamp calculated from `1970-01-01 00:00:00` (adjusted by the local time zone offset), with the unit being milliseconds (1 second = 1,000 milliseconds). This function supports processing `DATETIME` types with millisecond precision and automatically ignores time zone differences during conversion (using UTC time as the default reference).

## Syntax

```sql
MILLISECOND_TIMESTAMP(`<datetime>`)
```

## Parameters

| Parameter    | Description                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | Represents the datetime to be converted into a Unix timestamp. Supports the `DATETIME` type. For specific datetime formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion). |

## Return Value

Returns a `BIGINT` integer representing the Unix timestamp in milliseconds corresponding to the input datetime (total milliseconds converted to the current time zone). For time zone settings, see [Time Zone Management](../../../../admin-manual/cluster-management/time-zone).

- If the input is `NULL`, the function returns `NULL`.
- Converts datetime values with microseconds (automatically truncated to milliseconds).
- If the input datetime is before `1970-01-01 00:00:00.000 UTC`, the result is negative.

## Examples

```sql
-- Convert a DATETIME with millisecond precision, executed in a machine with the East 8 time zone
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123');
+--------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123') |
+--------------------------------------------------+
|                                    1737606896123 |
+--------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC');
+------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123 UTC') |
+------------------------------------------------------+
|                                        1737635696123 |
+------------------------------------------------------+

-- Convert datetime values with microseconds (automatically truncated to milliseconds)
SELECT MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456');
+-----------------------------------------------------+
| MILLISECOND_TIMESTAMP('2024-01-01 00:00:00.123456') |
+-----------------------------------------------------+
|                                       1704038400123 |
+-----------------------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MILLISECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MILLISECOND_TIMESTAMP('1960-01-01 00:00:00 UTC') |
+---------------------------------------------------+
|                                  -315619200000000 |
+---------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000 (results are negative in East 8 time zone)
SELECT MILLISECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MILLISECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                           -28800000 |
+-------------------------------------+

-- Input is NULL, returns NULL
SELECT MILLISECOND_TIMESTAMP(NULL);
+-----------------------------+
| MILLISECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL |
+-----------------------------+
```