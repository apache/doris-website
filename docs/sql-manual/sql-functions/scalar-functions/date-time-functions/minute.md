---
{
    "title": "MINUTE",
    "language": "en"
}
---

## Description

The MINUTE function extracts the minute component from the input datetime value, returning an integer ranging from 0 to 59. This function supports processing DATE, DATETIME, and TIME types.

This function is consistent with MySQL's [minute function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_minute).

## Syntax

```sql
MINUTE(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value, which can be of type DATE, DATETIME, or TIME. For specific datetime/date/time formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion), [time conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/time-conversion). |

## Return Value

Returns an INT type integer representing the minute value from the input datetime, with a range of 0-59.

- If the input is of DATE type (only includes year, month, and day), the default time part is 00:00:00, so it returns 0.
- If the input is NULL, returns NULL.

## Examples

```sql
-- Extract minute from DATETIME
SELECT MINUTE('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Extract minute from DATETIME with microseconds (ignores microseconds)
SELECT MINUTE('2023-05-01 10:05:30.123456') AS result;
+--------+
| result |
+--------+
|      5 |
+--------+

-- Does not automatically convert string to time type, returns NULL
SELECT MINUTE('14:25:45') AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+

-- Extract minute from DATE type (default time 00:00:00)
SELECT MINUTE('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL, returns NULL
SELECT MINUTE(NULL) AS result;
+--------+
| result |
+--------+
|   NULL |
+--------+
```
