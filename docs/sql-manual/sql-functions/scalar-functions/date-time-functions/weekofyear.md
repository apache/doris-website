---
{
    "title": "WEEKOFYEAR",
    "language": "en"
}
---

## Description
The WEEKOFYEAR function returns the week number of a specified date within the year (range 1-53).
A week starts on Monday and ends on Sunday.
Within a year, if a week contains 4 or more days in the current year, that week is considered the 1st week of the current year; otherwise, that week belongs to the last week of the previous year (which may be week 52 or 53).

This function behaves consistently with the [weekofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear) in MySQL.

## Syntax

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<datetime_or_date>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns INT type week number, range 1-53, representing which week of the year the date belongs to.

- If the week containing January 1st has fewer than 4 days in the current year (e.g., if January 1st is a Wednesday, that week only has January 1-3 in the current year, totaling 3 days), then that week belongs to the previous year, and the 1st week of the current year starts from the next Sunday.
- When the week at the end of December has fewer than 4 days total, that week belongs to the first week of the next year
- Input NULL returns NULL

## Examples

```sql
-- 2023-05-01 is Monday, belongs to week 18 of 2023
SELECT WEEKOFYEAR('2023-05-01') AS week_20230501; 
+---------------+
| week_20230501 |
+---------------+
|            18 |
+---------------+

-- The week from 2023-01-02 to 2023-01-08 contains 7 days in 2023 (≥4), belongs to week 1 of 2023
SELECT WEEKOFYEAR('2023-01-02') AS week_20230102;  
+---------------+
| week_20230102 |
+---------------+
|             1 |
+---------------+

-- 2024-01-01 (Monday) belongs to week 1 of 2024
SELECT WEEKOFYEAR('2024-01-01') AS week_20240101;
+---------------+
| week_20240101 |
+---------------+
|             1 |
+---------------+

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
