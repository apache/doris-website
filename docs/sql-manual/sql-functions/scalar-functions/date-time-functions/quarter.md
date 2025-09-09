---
{
    "title": "QUARTER",
    "language": "en"
}
---

## Description

The function returns the quarter (1 to 4) that the specified date belongs to. Each quarter contains three months:
- Quarter 1: January to March
- Quarter 2: April to June
- Quarter 3: July to September
- Quarter 4: October to December

This function behaves consistently with MySQL's [quarter function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_quarter).

## Syntax

```sql
QUARTER(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input date or datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Return Value

- Returns a TINYINT representing the quarter that the input date belongs to, ranging from 1 to 4.
- If the input value is NULL, the function returns NULL.

## Examples

```sql
--- Quarter 1 (January-March)
SELECT QUARTER('2025-01-16') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Including time component (does not affect result)
SELECT QUARTER('2025-01-16 01:11:10') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Quarter 2 (April-June)
SELECT QUARTER('2023-05-20') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

--- Quarter 3 (July-September)
SELECT QUARTER('2024-09-30 23:59:59') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

--- Quarter 4 (October-December)
SELECT QUARTER('2022-12-01') AS result;
+--------+
| result |
+--------+
|      4 |
+--------+

--- Input is NULL (returns NULL)
SELECT QUARTER(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```