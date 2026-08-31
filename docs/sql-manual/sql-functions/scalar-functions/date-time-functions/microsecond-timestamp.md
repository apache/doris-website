---
{
    "title": "MICROSECOND_TIMESTAMP",
    "language": "en",
    "description": "Converts a DATETIME or TIMESTAMP_NS value to a Unix timestamp in microseconds, truncating sub-microsecond digits."
}
---

## Description

The MICROSECOND_TIMESTAMP function converts a `DATETIME` or `TIMESTAMP_NS` value to a Unix timestamp in microseconds. For `TIMESTAMP_NS`, the final three nanosecond digits are truncated.

## Syntax

```sql
MICROSECOND_TIMESTAMP(`<datetime>`)
```

## Parameters

| Parameter       | Description                                                                                   |
|------------------|-----------------------------------------------------------------------------------------------|
| `<datetime>` | The `DATETIME` or `TIMESTAMP_NS` value to convert. |

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
| MICROSECOND_TIMESTAMP('1960-01-01 00:00:00 UTC')  |
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
