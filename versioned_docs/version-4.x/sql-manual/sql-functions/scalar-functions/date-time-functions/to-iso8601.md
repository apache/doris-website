---
{
    "title": "TO_ISO8601 | Date Time Functions",
    "language": "en",
    "description": "Converts datetime values to ISO8601 formatted strings, supporting input types DATETIME, DATE and TIMESTAMPTZ.",
    "sidebar_label": "TO_ISO8601"
}
---

# TO_ISO8601

## Description

Converts datetime values to ISO8601 formatted strings, supporting input types DATETIME, DATE and TIMESTAMPTZ.
The returned ISO8601 formatted datetime is represented as YYYY-MM-DDTHH:MM:SS, where T is the separator between date and time.

## Syntax

```sql
TO_ISO8601(`<date_or_date_expr>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_date_expr>` | Input datetime value, supports date/datetime/timestamptz types. For specific formats please see [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns VARCHAR type, representing the ISO8601 formatted datetime string.

- If input is DATE (e.g., '2023-10-05'), returns format YYYY-MM-DD (date only);
- If input is DATETIME (e.g., '2023-10-05 15:30:25'), returns format YYYY-MM-DDTHH:MM:SS.xxxxxx (date and time separated by T, xxxxxx are all zeros, fractional seconds in input datetime are rounded to seconds);
- If input is TIMESTAMPTZ (e.g., '2023-10-05 15:30:25+03:00'), returns format YYYY-MM-DDTHH:MM:SS.xxxxxx±HH:MM (offset reflects the session variable `time_zone` after converting to local_time);
- If input is NULL, returns NULL;

## Examples

```sql
-- Convert DATE type (date only)
SELECT TO_ISO8601(CAST('2023-10-05' AS DATE)) AS date_result;
+--------------+
| date_result  |
+--------------+
| 2023-10-05   |
+--------------+

-- Convert DATETIME type (with hours, minutes, seconds)
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:45.000000 |
+----------------------------+

-- Input with fractional seconds, rounded to seconds
SELECT TO_ISO8601(CAST('2020-01-01 12:30:45.956' AS DATETIME)) AS datetime_result;
+----------------------------+
| datetime_result            |
+----------------------------+
| 2020-01-01T12:30:46.000000 |
+----------------------------+

-- Input TIMESTAMPTZ, SET time_zone = '+08:00'
SELECT TO_ISO8601('2025-10-10 11:22:33+03:00');
+-----------------------------------------+
| TO_ISO8601('2025-10-10 11:22:33+03:00') |
+-----------------------------------------+
| 2025-10-10T16:22:33.000000+08:00        |
+-----------------------------------------+

-- Invalid date (returns NULL)
SELECT TO_ISO8601('2023-02-30') AS invalid_date;
+--------------+
| invalid_date |
+--------------+
| NULL         |
+--------------+

-- Input is NULL (returns NULL)
SELECT TO_ISO8601(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```

