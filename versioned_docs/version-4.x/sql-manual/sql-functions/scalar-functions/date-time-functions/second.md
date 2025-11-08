---
{
    "title": "SECOND",
    "language": "en"
}
---

## Description

The SECOND function extracts the seconds portion from a specified datetime value, returning an integer result from 0 to 59. This function supports processing DATE, DATETIME, and TIME types.

This function is consistent with MySQL's [second function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_second).

## Syntax

```sql
SECOND(<date_or_time_expr>)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value. Can be of type DATE, DATETIME, or TIME. For specific datetime/date/time formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion), [time conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/time-conversion). |

## Return Value

Returns a value of type INT, representing the seconds portion of the input datetime:

- Range: 0 to 59 (inclusive)
- If the input is DATE type, returns 0 (because default time is 00:00:00)
- If the input is NULL, returns NULL
- Ignores microseconds portion (e.g., 12:34:56.789 only extracts 56 seconds)

## Examples

```sql
-- Extract seconds from DATETIME
SELECT SECOND('2018-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
|     59 |
+--------+

-- Input is TIME type
SELECT SECOND(cast('15:42:33' as time)) AS result;
+--------+
| result |
+--------+
|     33 |
+--------+

-- Input is DATE type (default seconds is 0)
SELECT SECOND('2023-07-13') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Time with microseconds (ignores microseconds)
SELECT SECOND('2023-07-13 10:30:25.123456') AS result;
+--------+
| result |
+--------+
|     25 |
+--------+

-- Case where seconds is 0
SELECT SECOND('2024-01-01 00:00:00') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Input is NULL (returns NULL)
SELECT SECOND(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```