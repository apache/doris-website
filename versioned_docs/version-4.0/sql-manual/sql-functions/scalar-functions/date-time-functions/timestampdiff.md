---
{
  "title": "TIMESTAMPDIFF",
  "language": "en"
}
---

## Description

Same functionality as the [date-diff function](./datediff)
The TIMESTAMPDIFF function calculates the difference between two datetime values and returns the result in a specified time unit. This function supports multiple time units (such as seconds, minutes, hours, days, weeks, months, years).

This function behaves consistently with the [date_diff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-diff) in MySQL.

## Syntax

```sql
TIMESTAMPDIFF(<unit>, <date_or_time_expr1>, <date_or_time_expr2>)
```

## Parameters

| Parameter                | Description                                                                                                                                                                                                                                                                                                                                                 |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<unit>`                 | Time unit, specifies the unit to return the difference in. Common values include SECOND, MINUTE, HOUR, DAY, MONTH, QUARTER, YEAR, etc.                                                                                                                                                                                                                    |
| `<date_or_time_expr1>`   | The first datetime, start datetime. Supports date/datetime type input. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<date_or_time_expr2>`   | The second datetime, end datetime. Supports date/datetime type input                                                                                                                                                                                                                                                                                       |

## Return Value

Returns the difference between two datetimes, with type BIGINT.

- If `<date_or_time_expr2>` is later than `<date_or_time_expr1>`, returns a positive number
- If `<date_or_time_expr2>` is earlier than `<date_or_time_expr1>`, returns a negative number
- If any parameter is NULL, returns NULL
- If `<unit>` is an unsupported unit, returns an error
- When calculating a unit, the next unit is not ignored; for example, it calculates whether the real difference meets one day, and returns 0 if insufficient
- Special case for month calculation: e.g., 1-31 to 2-28 has a difference of one month
- When inputting date type, the time portion defaults to 00:00:00

## Examples

```sql
-- Calculate month difference between two dates
SELECT TIMESTAMPDIFF(MONTH, '2003-02-01', '2003-05-01') AS result;
+--------+
| result |
+--------+
|      3 |
+--------+

-- Calculate year difference (end date earlier than start date, returns negative value)
SELECT TIMESTAMPDIFF(YEAR, '2002-05-01', '2001-01-01') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

-- Calculate minute difference
SELECT TIMESTAMPDIFF(MINUTE, '2003-02-01', '2003-05-01 12:05:55') AS result;
+--------+
| result |
+--------+
| 128885 |
+--------+

-- Real difference insufficient for one day
SELECT TIMESTAMPDIFF(DAY, '2023-12-31 23:59:50', '2024-01-01 00:00:05') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Invalid unit QUARTER, returns error
SELECT TIMESTAMPDIFF(QUAR, '2023-01-01', '2023-07-01') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported time stamp diff time unit: QUAR, supported time unit: YEAR/MONTH/WEEK/DAY/HOUR/MINUTE/SECOND

-- Special case for month calculation (end of month crossing months)
SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-28') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

SELECT TIMESTAMPDIFF(MONTH, '2023-01-31', '2023-02-27') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

-- Any parameter is NULL (returns NULL)
SELECT TIMESTAMPDIFF(DAY, NULL, '2023-01-01'), TIMESTAMPDIFF(DAY, '2023-01-01', NULL) AS result;
+---------------------------------------+--------+
| timestampdiff(DAY, NULL, '2023-01-01') | result |
+---------------------------------------+--------+
| NULL                                  | NULL   |
+---------------------------------------+--------+

-- Week difference calculation
SELECT TIMESTAMPDIFF(WEEK, '2023-01-01', '2023-01-15') AS result;
+--------+
| result |
+--------+
|      2 |
+--------+

```