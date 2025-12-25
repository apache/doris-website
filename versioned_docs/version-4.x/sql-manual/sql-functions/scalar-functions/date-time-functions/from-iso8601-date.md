---
{
    "title": "FROM_ISO8601_DATE | Date Time Functions",
    "language": "en",
    "description": "Converts an ISO8601 formatted date expression to a DATE type date expression. Date strings conforming to the ISO 8601 standard,"
}
---

# FROM_ISO8601_DATE

## Description

Converts an ISO8601 formatted date expression to a DATE type date expression.
Date strings conforming to the ISO 8601 standard, supported formats include:
- YYYY: Year only (returns January 1st of that year)
- YYYY-MM: Year and month (returns the 1st of that month)
- YYYY-DDD: Year + day of year (DDD range 1-366, e.g., 0000-059 represents the 59th day of year 0000)
- YYYY-WWW: Year + week number (WWW range 1-53, returns Monday of that week)
- YYYY-WWW-D: Year + week number + day of week (D range 1-7, 1 represents Monday, 7 represents Sunday)
- In this format, the first week of a year must contain Thursday of that week, otherwise it is counted as a week of the previous year

## Syntax

```sql
from_iso8601_date(<dt>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | ISO8601 formatted date, of string type |

## Return Value

Returns DATE type in the format YYYY-MM-DD, representing the parsed specific date.
- If the input format is invalid (e.g., week number exceeds 53), returns NULL.
- If the input contains time or timezone information (e.g., 2023-10-01T12:34), returns NULL.
- Input NULL, returns NULL

## Examples

```sql
-- Parse different ISO 8601 formatted date strings
select 
    from_iso8601_date('2023') as year_only, 
    from_iso8601_date('2023-10') as year_month, 
    from_iso8601_date('2023-10-05') as full_date; 

+------------+------------+------------+
| year_only  | year_month | full_date  |
+------------+------------+------------+
| 2023-01-01 | 2023-10-01 | 2023-10-05 |
+------------+------------+------------+

-- Parse "year-day number" format
select 
    from_iso8601_date('2021-001') as day_1,  
    from_iso8601_date('2021-059') as day_59, 
    from_iso8601_date('2021-060') as day_60,  
    from_iso8601_date('2024-366') as day_366; 

+------------+------------+------------+------------+
| day_1      | day_59     | day_60     | day_366    |
+------------+------------+------------+------------+
| 0000-01-01 | 0000-02-28 | 0000-03-01 | 2024-12-31 |
+------------+------------+------------+------------+

-- Parse "YYY-MMM-D" format (each week starts with Monday), since 0522-01-01 is Thursday, dates before the first week will return year 0521
select from_iso8601_date('0522-W01-1') as week_1;
+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+
1 row in set (0.02 sec)

select from_iso8601_date('0522-W01-4') as week_4;
+------------+
| week_4     |
+------------+
| 0522-01-01 |
+------------+

---YYY-MMM format, Monday of the first week is in year 521
select from_iso8601_date('0522-W01') as week_1;

+------------+
| week_1     |
+------------+
| 0521-12-29 |
+------------+

---invalid style, return error
select from_iso8601_date('2023-10-01T12:34:10');
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation from_iso8601_date of 2023-10-01T12:34:10 is invalid

---input NULL
select from_iso8601_date(NULL);
+-------------------------+
| from_iso8601_date(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+
```
