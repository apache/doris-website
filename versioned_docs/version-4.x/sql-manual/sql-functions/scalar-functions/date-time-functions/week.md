---
{
    "title": "WEEK",
    "language": "en",
    "description": "The WEEK function returns the week number for a specified date, with default Mode 0."
}
---

## Description

The WEEK function returns the week number for a specified date, with default Mode 0. It supports customizing week calculation rules through the mode parameter (such as whether the first day of the week is Sunday or Monday, the range of week numbers, criteria for determining the first week, etc.).

The effect of the mode parameter is shown in the following table:

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


This function is consistent with the [week function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_week) in MySQL.

## Syntax
```sql
WEEK(`<date_or_time_expr>`)
WEEK(`<date_or_time_expr>`, `<mode>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<mode>` | Optional INT, default 0. The calculation rule is determined by `mode & 7`, selecting mode 0-7 from the table above. |

## Return Value
Returns INT type, representing the week number for the specified date, with specific range determined by `<mode>` (0-53 or 1-53).

- If `<mode>` is an integer outside 0-7, its lowest three bits (`mode & 7`) determine the calculation mode. For example, 8 selects mode 0, 9 selects mode 1, and -1 selects mode 7;
- If any parameter is NULL, returns NULL;
- Cross-year dates may return the last week of the previous year (e.g., January 1, 2023 belongs to week 52 of 2022 in some modes).

## Examples

Out-of-range modes use their lowest three bits. For example, 8 selects mode 0:

```sql
SELECT WEEK('2021-01-01', 8) AS mode_8,
       WEEK('2021-01-01', 0) AS mode_0,
       WEEK('2021-01-01', 7) AS mode_7;
```
```text
+--------+--------+--------+
| mode_8 | mode_0 | mode_7 |
+--------+--------+--------+
|      0 |      0 |     52 |
+--------+--------+--------+
```

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

-- -1 & 7 = 7, so mode 7 is used
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

-- Mode 7: weeks start on Monday and week 1 is the week containing the first Monday;
-- the first Monday of 2023 is Jan 2, so 2023-01-01 falls in the last week of 2022 (week 52)
SELECT WEEK('2023-01-01', 7) AS week_result;
+-------------+
| week_result |
+-------------+
|          52 |
+-------------+
```
