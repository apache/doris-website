---
{
    "title": "YEARWEEK",
    "language": "en"
}
---

## Description

The YEARWEEK function is used to return the "year + week number" combination for a specified date (format YYYYWW, e.g., 202301 represents week 1 of 2023). This function flexibly defines the start day of the week and the criteria for determining the "first week" through the optional parameter mode, defaulting to mode=0.

If the week containing the date belongs to the previous year, it returns the previous year's year and corresponding week number;
If the week containing the date belongs to the next year, it returns the next year's year and week 1;
Week numbers range from 1-53, depending on the mode configuration.

The effect of parameter mode is shown in the table below:

|Mode |First day of week |Week number range |Definition of first week                              |
|:----|:-----------------|:-----------------|:-----------------------------------------------------|
|0    |Sunday            |1-53              |The week containing the first Sunday of the year     |
|1    |Monday            |1-53              |The first week with 4 or more days in the year      |
|2    |Sunday            |1-53              |The week containing the first Sunday of the year     |
|3    |Monday            |1-53              |The first week with 4 or more days in the year      |
|4    |Sunday            |1-53              |The first week with 4 or more days in the year      |
|5    |Monday            |1-53              |The week containing the first Monday of the year     |
|6    |Sunday            |1-53              |The first week with 4 or more days in the year      |
|7    |Monday            |1-53              |The week containing the first Monday of the year     |

This function behaves consistently with the [yearweek function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_yearweek) in MySQL.

## Syntax

```sql
YEARWEEK(DATE `<date_or_time_expr>`[, INT mode])
```

## Return Value

Returns an INT type integer in YYYYWW format (first 4 digits are the year, last 2 digits are the week number), e.g., 202305 represents week 5 of 2023, 202052 represents week 52 of 2020.

- If the week containing the date belongs to the previous year, returns the previous year's year and week number (e.g., January 1, 2021 might return 202052).
- If the week containing the date belongs to the next year, returns the next year's year and week 1 (e.g., December 30, 2024 might return 202501).
- If input is NULL, returns NULL.

## Examples

```sql
-- Default mode=0 (Sunday start, first week contains first Sunday)
-- 2021-01-01 is Friday, the first Sunday of the week is 2020-12-27, so it belongs to week 52 of 2020
SELECT YEARWEEK('2021-01-01') AS yearweek_mode0;
+----------------+
| yearweek_mode0 |
+----------------+
|         202052 |
+----------------+

-- mode=1 (Monday start, 4-day rule, consistent with WEEKOFYEAR)
SELECT YEARWEEK('2020-07-01', 1) AS yearweek_mode1;
+----------------+
| yearweek_mode1 |
+----------------+
|         202027 |
+----------------+

-- mode=1, cross-year week (2024-12-30 is Monday, the week has ≥4 days in 2025, belongs to week 1 of 2025)
SELECT YEARWEEK('2024-12-30', 1) AS cross_year_mode1;
+------------------+
| cross_year_mode1 |
+------------------+
|           202501 |
+------------------+

-- mode=5 (Monday start, first week contains first Monday)
-- 2023-01-02 is Monday (first Monday of the year), the week is week 1 of 2023
SELECT YEARWEEK('2023-01-02', 5) AS yearweek_mode5;
+----------------+
| yearweek_mode5 |
+----------------+
|         202301 |
+----------------+

-- Input DATE type
SELECT YEARWEEK('2023-12-25', 1) AS date_type_mode1;
+------------------+
| date_type_mode1  |
+------------------+
|           202352 |
+------------------+

-- Input NULL (returns NULL)
SELECT YEARWEEK(NULL) AS null_input;
+------------+
| null_input |
+------------+
|       NULL |
+------------+
```

## yearweek
### Description
#### Syntax

`INT YEARWEEK(DATE date[, INT mode])`

Returns year and week for a date.The value of the mode argument defaults to 0.
When the week of the date belongs to the previous year, the year and week of the previous year are returned; 
when the week of the date belongs to the next year, the year of the next year is returned and the week is 1.

The following table describes how the mode argument works.

|Mode |First day of week |Range   |Week 1 is the first week …    |
|:----|:-----------------|:-------|:-----------------------------|
|0    |Sunday            |1-53    |with a Sunday in this year    |
|1    |Monday            |1-53    |with 4 or more days this year |
|2    |Sunday            |1-53    |with a Sunday in this year    |
|3    |Monday            |1-53    |with 4 or more days this year |
|4    |Sunday            |1-53    |with 4 or more days this year |
|5    |Monday            |1-53    |with a Monday in this year    |
|6    |Sunday            |1-53    |with 4 or more days this year |
|7    |Monday            |1-53    |with a Monday in this year    |

The parameter is Date or Datetime type

### example
```
mysql> select yearweek('2021-1-1');
+----------------------+
| yearweek('2021-1-1') |
+----------------------+
|               202052 |
+----------------------+
```
```
mysql> select yearweek('2020-7-1');
+----------------------+
| yearweek('2020-7-1') |
+----------------------+
|               202026 |
+----------------------+
```
```
mysql> select yearweek('2024-12-30',1);
+------------------------------------+
| yearweek('2024-12-30 00:00:00', 1) |
+------------------------------------+
|                             202501 |
+------------------------------------+
```

### keywords
    YEARWEEK
