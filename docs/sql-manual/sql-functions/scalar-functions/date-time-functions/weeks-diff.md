---
{
   "title": "WEEKS_DIFF",
   "language": "en"
}
---

## Description
The WEEKS_DIFF function calculates the difference in complete weeks between two date or time values, with the result being the number of weeks from the end time minus the start time (treating 7 days as 1 week). It supports processing DATE, DATETIME types and properly formatted strings, considering the complete time difference (including hours, minutes, seconds) in calculations.

## Syntax

```sql
WEEKS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr1>` | Later date or datetime, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>` | Earlier date or datetime, supports date/datetime types |

## Return Value

Returns INT type integer, representing the complete week difference between `<date_or_time_expr1>` and `<date_or_time_expr2>`:

- If `<date_or_time_expr1>` is later than `<date_or_time_expr2>`, returns positive number (total day difference ÷ 7, integer part).
- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns negative number (same calculation method, result negated).
- If input is DATE type, defaults its time portion to 00:00:00.
- Calculation considers complete time difference (including hours, minutes, seconds), only counting "full 7 days" portions, ignoring days less than a week.
- If any parameter is NULL, returns NULL.
- Only counts "full 7 days" portions, e.g., 8 days difference returns 1 week, 6 days difference returns 0 weeks. For example, '2023-10-08 00:00:00' and '2023-10-01 12:00:00' differ by 6.5 days, returns 0 weeks; while '2023-10-08 12:00:00' and '2023-10-01 00:00:00' differ by 7.5 days, returns 1 week.

## Examples
```sql
-- Two DATE types differ by 8 weeks (56 days)
SELECT WEEKS_DIFF('2020-12-25', '2020-10-25') AS diff_date;
+-----------+
| diff_date |
+-----------+
|         8 |
+-----------+

-- DATETIME type with time portions (total 56 days difference, ignoring hour/minute/second differences)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25 12:10:02') AS diff_datetime;
+---------------+
| diff_datetime |
+---------------+
|             8 |
+---------------+

-- Mixed DATE and DATETIME calculation (DATE defaults to 00:00:00)
SELECT WEEKS_DIFF('2020-12-25 10:10:02', '2020-10-25') AS diff_mixed;
+-------------+
| diff_mixed  |
+-------------+
|           8 |
+-------------+

-- Less than 1 week (6 days), returns 0
SELECT WEEKS_DIFF('2023-10-07', '2023-10-01') AS diff_6_days;
+-------------+
| diff_6_days |
+-------------+
|           0 |
+-------------+

-- More than 1 week (8 days), returns 1
SELECT WEEKS_DIFF('2023-10-09', '2023-10-01') AS diff_8_days;
+-------------+
| diff_8_days |
+-------------+
|           1 |
+-------------+

-- Time portion impact: 7.5 days difference (returns 1) vs 6.5 days (returns 0)
SELECT 
  WEEKS_DIFF('2023-10-08 12:00:00', '2023-10-01 00:00:00') AS diff_7_5d,
  WEEKS_DIFF('2023-10-08 00:00:00', '2023-10-01 12:00:00') AS diff_6_5d;
+-----------+-----------+
| diff_7_5d | diff_6_5d |
+-----------+-----------+
|         1 |         0 |
+-----------+-----------+

-- End time earlier than start time, returns negative number
SELECT WEEKS_DIFF('2023-10-01', '2023-10-08') AS diff_negative;
+---------------+
| diff_negative |
+---------------+
|            -1 |
+---------------+

-- Cross-year calculation (2023-12-25 to 2024-01-01 differs by 7 days, returns 1)
SELECT WEEKS_DIFF('2024-01-01', '2023-12-25') AS cross_year;
+------------+
| cross_year |
+------------+
|          1 |
+------------+

-- Any parameter is NULL (returns NULL)
SELECT 
  WEEKS_DIFF(NULL, '2023-10-01') AS null_input1,
  WEEKS_DIFF('2023-10-01', NULL) AS null_input2;
+------------+------------+
| null_input1 | null_input2 |
+------------+------------+
| NULL       | NULL       |
+------------+------------+
```