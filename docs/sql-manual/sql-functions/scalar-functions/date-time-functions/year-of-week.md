---
{
    "title": "YEAR_OF_WEEK",
    "language": "en",
    "description": "The YEAROFWEEK function returns the week-year (year of week) for a specified date according to the ISO 8601 week calendar standard."
}
---

## Description

The YEAR_OF_WEEK function returns the week-year (year of week) for a specified date according to the ISO 8601 week calendar standard. Unlike regular years, ISO week-years are calculated in week units, where the first week of a year is the week containing January 4th, and that week must contain at least 4 days belonging to that year.

Unlike the [year function](./year), which simply returns the year of the input date, YEAR_OF_WEEK follows the ISO week calendar standard.

For more detailed information, please refer to [ISO Week Date](https://en.wikipedia.org/wiki/ISO_week_date).

## Alias

- `YOW`

## Syntax

```sql
YEAR_OF_WEEK(`<date_or_time_expr>`)
YOW(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | Input datetime value, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion)|

## Return Value

Returns SMALLINT type, representing the week-year calculated according to ISO 8601 week calendar standard.

- Return value range is typically 1-9999
- If input is NULL, returns NULL
- If input is DATETIME type, only considers the date part, ignoring the time part

## Examples

```sql
-- 2005-01-01 is Saturday, this week starts from 2004-12-27, contains more days in 2004, belongs to 2004
SELECT YEAR_OF_WEEK('2005-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2004 |
+------------+

-- Using alias YOW, same result
SELECT YOW('2005-01-01') AS yow_alias_result;
+------------------+
| yow_alias_result |
+------------------+
|             2004 |
+------------------+

-- 2005-01-03 is Monday, this week (2005-01-03 to 2005-01-09) is the first week of 2005
SELECT YEAR_OF_WEEK('2005-01-03') AS yow_result;
+------------+
| yow_result |
+------------+
|       2005 |
+------------+

-- 2023-01-01 is Sunday, this week starts from 2022-12-26, belongs to the last week of 2022
SELECT YEAR_OF_WEEK('2023-01-01') AS yow_result;
+------------+
| yow_result |
+------------+
|       2022 |
+------------+

-- 2023-01-02 is Monday, this week (2023-01-02 to 2023-01-08) is the first week of 2023
SELECT YEAR_OF_WEEK('2023-01-02') AS yow_result;
+------------+
| yow_result |
+------------+
|       2023 |
+------------+

-- DATETIME type input, ignoring time part
SELECT YEAR_OF_WEEK('2005-01-01 15:30:45') AS yow_datetime;
+--------------+
| yow_datetime |
+--------------+
|         2004 |
+--------------+

-- Cross-year boundary case: 2024-12-30 is Monday, belongs to the first week of 2025
SELECT YEAR_OF_WEEK('2024-12-30') AS yow_result;
+------------+
| yow_result |
+------------+
|       2025 |
+------------+

-- Input is NULL, returns NULL
SELECT YEAR_OF_WEEK(NULL) AS yow_null;
+----------+
| yow_null |
+----------+
|     NULL |
+----------+
```
