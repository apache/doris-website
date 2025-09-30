---
{
    "title": "NEXT_DAY",
    "language": "en"
}
---

## Description

The NEXT_DAY function returns the first date after the specified date that matches the target day of the week. For example, NEXT_DAY('2020-01-31', 'MONDAY') returns the first Monday after 2020-01-31. This function supports processing DATE and DATETIME types and ignores the time portion in the input (calculation is based only on the date portion).

This function is consistent with Oracle's [next_day function](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/NEXT_DAY.html).

## Syntax

```sql
NEXT_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | Supports date/datetime types. For specific datetime and date formats, [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<day_of_week>` | String expression used to identify the day of the week, of string type. |

`<day_of_week>` must be one of the following values (case insensitive):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Return Value

Returns a value of type DATE, representing the first date after the base date that matches `<day_of_week>`.

Special cases:
- If the base date itself is the target day of the week, returns the next occurrence of the target day of the week (not the current date);
- If `<date_or_time_expr>` is NULL, returns NULL;
- If `<day_of_week>` is an invalid value (e.g., 'ABC'), throws an exception;
- If the input is 9999-12-31 (regardless of whether it includes time), returns itself (since this date is the maximum valid date, no subsequent dates exist);

## Examples

```sql
--- First Monday after base date
SELECT NEXT_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

--- Including time component (ignores time, uses only date for calculation)
SELECT NEXT_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-02-03 |
+------------+

--- Base date itself is target day of week (returns next occurrence)
SELECT NEXT_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-24 |
+------------+

--- Target day of week as abbreviation (case insensitive)
SELECT NEXT_DAY('2023-07-13', 'FR') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-14 |
+------------+

--- Input is NULL (returns NULL)
SELECT NEXT_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws exception)
mysql> SELECT NEXT_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function next_day failed to parse weekday: ABC

--- Maximum date (returns itself)
SELECT NEXT_DAY('9999-12-31 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 9999-12-31 |
+------------+
``` 
