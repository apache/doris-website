---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "en",
    "description": "The MICROSECONDTIMESTAMP function is used to convert an input datetime value into a Unix timestamp calculated from 1970-01-01 00:00:00 (adjusted by "
}
---

## Description

The MICROSECOND_TIMESTAMP function is used to convert an input datetime value into a Unix timestamp calculated from 1970-01-01 00:00:00 (adjusted by the local time zone offset), with the unit being microseconds (1 second = 1,000,000 microseconds). This function supports processing DATETIME types with microsecond precision, and automatically ignores time zone differences during conversion (using UTC time as the default reference).

## Syntax

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## Parameters

| Parameter       | Description                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>`     | Represents the datetime to be converted into a Unix timestamp. Supports the `DATETIME` type. For specific datetime formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |

## Return Value

Returns a `BIGINT` integer representing the Unix timestamp in microseconds corresponding to the input datetime (total microseconds converted to the current time zone).

- If the input is `NULL`, the function returns `NULL`.
- If the input datetime is before 1970-01-01 00:00:00.000 UTC, the result is negative.

## Examples

```sql
-- Convert a DATETIME with microsecond precision, executed in a machine with the East 8 time zone
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456');
+-----------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456') |
+-----------------------------------------------------+
|                                    1737606896123456 |
+-----------------------------------------------------+

-- Explicitly specify the time zone as UTC
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC');
+---------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 UTC') |
+---------------------------------------------------------+
|                                        1737635696123456 |
+---------------------------------------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECOND_TIMESTAMP('1970-01-01');
+-------------------------------------+
| MICROSECOND_TIMESTAMP('1970-01-01') |
+-------------------------------------+
|                        -28800000000 |
+-------------------------------------+

-- Specified time zone is out of range, returns NULL
SELECT MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00');
+------------------------------------------------------------+
| MICROSECOND_TIMESTAMP('2025-01-23 12:34:56.123456 +15:00') |
+------------------------------------------------------------+
|                                                       NULL |
+------------------------------------------------------------+

-- If the input datetime is before 1970 (standard UTC), returns a negative value
SELECT MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC');
+---------------------------------------------------+
| MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC') |
+---------------------------------------------------+
|                                  -315619200000000 |
+---------------------------------------------------+

-- Input is NULL, returns NULL
SELECT MICROSECOND_TIMESTAMP(NULL);
+-----------------------------+
| MICROSECOND_TIMESTAMP(NULL) |
+-----------------------------+
|                        NULL  |
+-----------------------------+
```