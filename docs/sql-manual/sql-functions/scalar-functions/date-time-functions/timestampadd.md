---
{
  "title": "TIMESTAMPADD",
  "language": "en"
}
---

## Description

Same functionality as the [date_add function](./date-add)
The TIMESTAMPADD function adds (or subtracts) a specified time interval of a specified unit to a given datetime value and returns the calculated datetime value. This function supports multiple time units (such as seconds, minutes, hours, days, weeks, months, years, etc.) and can flexibly handle datetime offset calculations. Negative intervals indicate subtracting the corresponding time.

This function behaves consistently with the [timestampadd function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_timestampadd) in MySQL.

## Syntax

```sql
TIMESTAMPADD(<unit>, <interval>, <date_or_time_expr>)
```

## Parameters

| Parameter             | Description                                                                                                                                                                                                                                                                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`              | Time unit, specifies the time unit to add. Common values include SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, QUARTER, YEAR                                                                                                                                                                                                                                    |
| `<interval>`          | The time interval to add, typically an integer, which can be positive or negative to indicate adding or subtracting time length                                                                                                                                                                                                                            |
| `<date_or_time_expr>` | Valid target date, supports date/datetime type input. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

The return value represents the result of adding the specified interval to the base datetime.

- If the input is date type and the time unit is YEAR/MONTH/WEEK/DAY, returns date type; otherwise returns datetime type
- If the input is datetime type, the return is also datetime type
- If the calculation result exceeds the valid range of DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), throws an exception
- If `<datetime_expr>` is an invalid date (such as 0000-00-00, 2023-13-01) or `<unit>` is an unsupported unit, throws an exception
- If any parameter is NULL, returns NULL
- When processing months/years, automatically adapts end-of-month dates (e.g., 2023-01-31 plus 1 month becomes 2023-02-28 or 2023-02-29, depending on whether it's a leap year)

## Examples

```sql
-- Add 1 minute
SELECT TIMESTAMPADD(MINUTE, 1, '2019-01-02') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-02 00:01:00 |
+---------------------+

-- Add 1 week (7 days)
SELECT TIMESTAMPADD(WEEK, 1, '2019-01-02') AS result;
+------------+
| result     |
+------------+
| 2019-01-09 |
+------------+

-- Subtract 3 hours
SELECT TIMESTAMPADD(HOUR, -3, '2023-07-13 10:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 07:30:00 |
+---------------------+

-- End of month plus 1 month (automatically adapts to February days)
SELECT TIMESTAMPADD(MONTH, 1, '2023-01-31') AS result;
+------------+
| result     |
+------------+
| 2023-02-28 |
+------------+

-- Cross-year add 1 year
SELECT TIMESTAMPADD(YEAR, 1, '2023-12-31 23:59:59') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-12-31 23:59:59 |
+---------------------+

-- Invalid unit
SELECT TIMESTAMPADD(MIN, 5, '2023-01-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: MIN, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Any parameter is NULL
SELECT TIMESTAMPADD(YEAR,NULL, '2023-12-31 23:59:59') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Unit not supported, invalid
SELECT TIMESTAMPADD(YEAR,10000, '2023-12-31 23:59:59') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_add of 2023-12-31 23:59:59, 10000 out of range
```
