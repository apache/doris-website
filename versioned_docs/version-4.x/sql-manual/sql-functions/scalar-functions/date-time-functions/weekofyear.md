---
{
    "title": "WEEKOFYEAR",
    "language": "en",
    "description": "The WEEKOFYEAR function returns the week number of a specified date within the year (range 1-53). A week starts on Monday and ends on Sunday."
}
---

## Description
The WEEKOFYEAR function returns the week number of a specified date within the year (range 1-53).
A week starts on Monday and ends on Sunday.
Within a year, if a week contains 4 or more days in the current year, that week is considered the 1st week of the current year; otherwise, that week belongs to the last week of the previous year (which may be week 52 or 53).

This function is consistent with the [weekofyear function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_weekofyear) in MySQL.

## Syntax

```sql
INT WEEKOFYEAR(`<date_or_time_expr>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns INT type week number, range 1-53, representing which week of the year the date belongs to.

- If the week containing January 1st has fewer than 4 days in the current year (e.g., if January 1st is a Wednesday, that week only has January 1-3 in the current year, totaling 3 days), then that week belongs to the previous year, and the 1st week of the current year starts from the next Monday.
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

-- The week 2021-12-27 (Monday) through 2022-01-02 (Sunday) only has 2 days
-- in 2022 (<4), so it belongs to the last week of 2021 (week 52)
SELECT WEEKOFYEAR('2022-01-02') AS week_20220102;
+---------------+
| week_20220102 |
+---------------+
|            52 |
+---------------+

-- 2023-12-25 (Monday) through 2023-12-31 (Sunday) has 7 days in 2023 (≥4),
-- so it belongs to week 52 of 2023
SELECT WEEKOFYEAR('2023-12-25') AS week_20231225;
+---------------+
| week_20231225 |
+---------------+
|            52 |
+---------------+

-- Pre-modern dates work too — the function does not validate a minimum year
SELECT weekofyear('1023-01-04');
+--------------------------+
| weekofyear('1023-01-04') |
+--------------------------+
|                        1 |
+--------------------------+

-- NULL input (returns NULL)
SELECT WEEKOFYEAR(NULL) AS week_null_input; 
+-----------------+
| week_null_input |
+-----------------+
|            NULL |
+-----------------+
```
