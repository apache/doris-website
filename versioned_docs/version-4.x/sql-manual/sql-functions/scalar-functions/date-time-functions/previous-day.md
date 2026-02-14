---
{
    "title": "PREVIOUS_DAY",
    "language": "en"
}
---

## Description

The PREVIOUS_DAY function returns the first date that matches the target day of the week before the specified date. For example, `PREVIOUS_DAY('2020-01-31', 'MONDAY')` represents the first Monday before 2020-01-31. This function supports DATE, DATETIME, and TIMESTAMPTZ types, and ignores the time part of the input (calculating based on the date part only).

:::note
This function has been supported since 4.0.4.
:::

## Syntax

```sql
PREVIOUS_DAY(`<date_or_time_expr>`, `<day_of_week>`)
```

## Parameters

| Parameter             | Description                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | Supports DATE/DATETIME types. For specific formats, please refer to [TIMESTAMPTZ Conversion](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion.md), [DATETIME Conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [DATE Conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<day_of_week>`       | A string expression identifying the day of the week.                                                                                                                                                                                                                                                                                                                                                                        |

`<day_of_week>` must be one of the following values (case-insensitive):
- 'SU', 'SUN', 'SUNDAY'
- 'MO', 'MON', 'MONDAY'
- 'TU', 'TUE', 'TUESDAY'
- 'WE', 'WED', 'WEDNESDAY'
- 'TH', 'THU', 'THURSDAY'
- 'FR', 'FRI', 'FRIDAY'
- 'SA', 'SAT', 'SATURDAY'

## Return Value

Returns a value of type DATE, representing the first date matching `<day_of_week>` before the base date.

Special cases:
- If the base date itself is the target weekday, returns the target weekday of the previous week (not the current date).
- If `<date_or_time_expr>` is NULL, returns NULL.
- If `<day_of_week>` is an invalid value (e.g., 'ABC'), throws an exception.
- If the input is 0000-01-01 (regardless of whether it contains time), returns itself (since this date is the minimum valid date, no prior date exists).

## Examples

```sql
--- The first Monday before the base date
SELECT PREVIOUS_DAY('2020-01-31', 'MONDAY') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- Including time part (time is ignored, calculation based on date only)
SELECT PREVIOUS_DAY('2020-01-31 02:02:02', 'MON') AS result;
+------------+
| result     |
+------------+
| 2020-01-27 |
+------------+

--- The base date itself is the target weekday (returns the previous one)
SELECT PREVIOUS_DAY('2023-07-17', 'MON') AS result;  -- 2023-07-17 is Monday
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

--- Target weekday is an abbreviation (case-insensitive)
SELECT PREVIOUS_DAY('2023-07-13', 'WE') AS result;  -- 2023-07-13 is Thursday
+------------+
| result     |
+------------+
| 2023-07-12 |
+------------+

--- Input is NULL (returns NULL)
SELECT PREVIOUS_DAY(NULL, 'SUN') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

--- Invalid weekday identifier (throws an exception)
mysql> SELECT PREVIOUS_DAY('2023-07-13', 'ABC') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Function previous_day failed to parse weekday: ABC

--- Minimum date (returns itself)
SELECT PREVIOUS_DAY('0000-01-01 12:00:00', 'SUNDAY') AS result;
+------------+
| result     |
+------------+
| 0000-01-01 |
+------------+
```
