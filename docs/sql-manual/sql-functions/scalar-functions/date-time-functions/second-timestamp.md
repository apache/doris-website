---
{
    "title": "SECOND_TIMESTAMP",
    "language": "en",
    "description": "The SECONDTIMESTAMP function converts an input datetime value to a Unix timestamp (in seconds),"
}
---

## Description

The SECOND_TIMESTAMP function converts an input datetime value to a Unix timestamp (in seconds), which represents the total number of seconds from 1970-01-01 00:00:00 UTC to the specified datetime. This function supports processing DATETIME values, and the result will be adjusted for the machine's timezone offset. For timezone information, please refer to [Timezone Management](../../../../admin-manual/cluster-management/time-zone).

## Alias

- UNIX_TIMESTAMP()

## Syntax

```sql
SECOND_TIMESTAMP(<datetime>)
```

## Parameters

| Parameter    | Description                                                                                                                                                                                                                                       |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<datetime>` | Required. The input DATETIME value representing the datetime to be converted to Unix timestamp. Supports datetime type input. For specific datetime formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |

## Return Value

Returns a BIGINT type representing the Unix timestamp (in seconds) in the current timezone corresponding to the input datetime.

Special cases:
- If the input is a DATE type (containing only year, month, day), the time portion defaults to 00:00:00
- If the input datetime is earlier than 1970-01-01 00:00:00 UTC, returns a negative timestamp
- If `<datetime>` is NULL, returns NULL

## Examples

```sql
--input init datetime
SELECT SECOND_TIMESTAMP('1970-01-01 00:00:00 UTC') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- DATETIME type to timestamp
SELECT SECOND_TIMESTAMP('2025-01-23 12:34:56') AS result;
+------------+
| result     |
+------------+
| 1737606896 |
+------------+

-- DATE type (default time is 00:00:00)
SELECT SECOND_TIMESTAMP('2023-01-01') AS result;
+------------+
| result     |
+------------+
| 1672502400 |
+------------+

-- Date earlier than 1970-01-01 (returns negative number)
SELECT SECOND_TIMESTAMP('1964-10-31 23:59:59') AS result;
+------------+
| result     |
+------------+
| -163065601 |
+------------+

-- DATETIME with microseconds (microseconds ignored)
SELECT SECOND_TIMESTAMP('2023-07-13 22:28:18.456789') AS result;
+------------+
| result     |
+------------+
| 1689258498 |
+------------+

-- Input is NULL (returns NULL)
SELECT SECOND_TIMESTAMP(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```