---
{
    "title": "WEEK",
    "language": "en"
}
---

## Description

The WEEK function returns the week number for a specified date, with default Mode 0. It supports customizing week calculation rules through the mode parameter (such as whether the first day of the week is Sunday or Monday, the range of week numbers, criteria for determining the first week, etc.).

The effect of the mode parameter is shown in the following table:

```sql
|Mode |First day of week |Week number range |Definition of the first week                     |
|:----|:-----------------|:-----------------|:------------------------------------------------|
|0    |Sunday            |0-53             |The week containing the first Sunday of the year |
|1    |Monday            |0-53             |The first week with 4 or more days in this year  |
|2    |Sunday            |1-53             |The week containing the first Sunday of the year |
|3    |Monday            |1-53             |The first week with 4 or more days in this year  |
|4    |Sunday            |0-53             |The first week with 4 or more days in this year  |
|5    |Monday            |0-53             |The week containing the first Monday of the year |
|6    |Sunday            |1-53             |The first week with 4 or more days in this year  |
|7    |Monday            |1-53             |The week containing the first Monday of the year |
```

This function is consistent with the [week function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_week) in MySQL.

## Syntax
```sql
WEEK(`<date_or_time_expr>`)
WEEK(`<date_or_time_expr>`, `<mode>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<datetime_or_date>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `mode` | Specified calculation method for the first week of the year, type INT, range 0-7 |

## Return Value
Returns INT type, representing the week number for the specified date, with specific range determined by `<mode>` (0-53 or 1-53).

- If `<mode>` is an integer outside 0-7, calculation is performed using Mode 7;
- If any parameter is NULL, returns NULL;
- Cross-year dates may return the last week of the previous year (e.g., January 1, 2023 belongs to week 52 of 2022 in some modes).

## Examples
```sql
-- 2020-01-01 is Wednesday, the first Sunday of the year is 2020-01-05, so it belongs to week 0
SELECT WEEK('2020-01-01') AS week_result;
+-------------+
| week_result |
+-------------+
|           0 |
+-------------+

-- 2020-07-01 is Wednesday, its week contains ≥4 days belonging to 2020, so it's week 27
SELECT WEEK('2020-07-01', 1) AS week_result;
+-------------+
| week_result |
+-------------+
|          27 |
+-------------+

-- Compare mode=0 and mode=3 (differences between different rules)
SELECT 
  WEEK('2023-01-01', 0) AS mode_0, 
  WEEK('2023-01-01', 3) AS mode_3;  
+--------+--------+
| mode_0 | mode_3 |
+--------+--------+
|      1 |     52 |
+--------+--------+

-- Input outside 0-7 range, processed as mode 7
SELECT WEEK('2023-01-01', -1) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |
+-------------+

-- Input is DATETIME type (ignores time portion)
SELECT WEEK('2023-12-31 23:59:59', 3) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |  
+-------------+

-- Any parameter is NULL, result returns NULL
SELECT WEEK('2023-12-31 23:59:59', NULL), WEEK(NULL, 3);
+-----------------------------------+--------------+
| WEEK('2023-12-31 23:59:59', NULL) | WEEK(NULL,3) |
+-----------------------------------+--------------+
|                              NULL |         NULL |
+-----------------------------------+--------------+
```
