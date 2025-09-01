---
{
    "title": "YEARS_DIFF",
    "language": "en"
}
---

## Description

The YEARS_DIFF function is used to calculate the complete year difference between two date or time values, with the result being the number of years from the start time to the end time. It supports processing DATE and DATETIME types, and considers the complete time difference (including months, days, hours, minutes, and seconds) when calculating.

## Syntax

```sql
YEARS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr1>` | End date, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Start date, supports date/datetime types and strings conforming to date-time format |

## Return Value

Returns an INT type integer representing the complete year difference between `<date_or_time_expr1>` and `<date_or_time_expr2>`:

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, returns a positive number (must satisfy "complete year" condition, e.g., '2022-03-15 08:30:00' and '2021-03-15 09:10:00' actually differ by less than a full year, returns 0).
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns a negative number (calculation method same as above, result negated).
- If input is DATE type, defaults its time part to 00:00:00.
- If any parameter is NULL, returns NULL.
- Special leap year February case (e.g., 2024 is a leap year, February 29th vs February 28th 2023, constitutes a full year)

## Examples

```sql
-- Year difference of 1 year, and month-day equal (full year)
SELECT YEARS_DIFF('2020-12-25', '2019-12-25') AS diff_full_year;
+----------------+
| diff_full_year |
+----------------+
|              1 |
+----------------+

-- Year difference of 1 year, but end month-day earlier than start month-day (less than a year)
SELECT YEARS_DIFF('2020-11-25', '2019-12-25') AS diff_less_than_year;
+---------------------+
| diff_less_than_year |
+---------------------+
|                   0 |
+---------------------+

-- DATETIME type with time components
SELECT YEARS_DIFF('2022-03-15 08:30:00', '2021-03-15 09:10:00') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             0 |
+---------------+

-- Mixed DATE and DATETIME calculation, DATE type input defaults time part to 00:00:00
SELECT YEARS_DIFF('2024-05-20', '2020-05-20 12:00:00') AS diff_mixed;
+------------+
| diff_mixed |
+------------+
|          3 |
+------------+

-- End time earlier than start time, returns negative number
SELECT YEARS_DIFF('2018-06-10', '2020-06-10') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -2 |
+---------------+

-- Special leap year February case (2024 is a leap year, February 29th vs February 28th 2023, constitutes a full year)
SELECT YEARS_DIFF('2024-02-29', '2023-02-28') AS leap_year_diff;
+----------------+
| leap_year_diff |
+----------------+
|              1 |
+----------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  YEARS_DIFF(NULL, '2023-03-15') AS null_input1,
  YEARS_DIFF('2023-03-15', NULL) AS null_input2;
+-------------+-------------+
| null_input1 | null_input2 |
+-------------+-------------+
| NULL        | NULL        |
+-------------+-------------+
```
