---
{
    "title": "MONTHS_DIFF",
    "language": "en"
}
---

## Description

The MONTHS_DIFF function is used to calculate the integer month difference between two datetime values, returning the result as the number of months obtained by subtracting `<startdate>` from `<enddate>`. This function supports processing DATE and DATETIME types, calculating based only on the date portion (year, month, day) and ignoring the time portion (hours, minutes, seconds).

## Syntax

```sql
MONTHS_DIFF(`<date_or_time_expr1>`, `<date_or_time_expr2>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr1>` | End date. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<date_or_time_expr2>` | Start date. Supports date/datetime types. |

## Return Value

Returns the number of months obtained by subtracting `<date_or_time_expr2>` from `<date_or_time_expr1>`, of type BIGINT.

Base difference = (end year - start year) × 12 + (end month - start month);
If the day component of the end date < the day component of the start date, then final result = base difference - 1;
Otherwise, final result = base difference.

- If `<date_or_time_expr1>` is earlier than `<date_or_time_expr2>`, returns a negative value (calculation logic is the same, only the sign is opposite);
- If any parameter is NULL, returns NULL;

## Examples

```sql
--- Year-month difference is 1, and end day < start day (result minus 1)
SELECT MONTHS_DIFF('2020-03-28', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Year-month difference is 1, and end day = start day
SELECT MONTHS_DIFF('2020-03-29', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- Year-month difference is 1, and end day > start day
SELECT MONTHS_DIFF('2020-03-30', '2020-02-29') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

--- End date is earlier than start date (negative value logic is the same)
SELECT MONTHS_DIFF('2020-02-29', '2020-03-28') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

SELECT MONTHS_DIFF('2020-02-29', '2020-03-29') AS result;
+--------+
| result |
+--------+
|     -1 |
+--------+

--- Same month (result is 0)
SELECT MONTHS_DIFF('2023-07-15', '2023-07-30') AS result;
+--------+
| result |
+--------+
|      0 |
+--------+

--- Input is NULL (returns NULL)
SELECT MONTHS_DIFF(NULL, '2023-01-01') AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
