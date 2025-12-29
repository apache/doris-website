---
{
    "title": "UTC_DATE",
    "language": "en",
    "description": "The UTCDATE function returns the current date in the UTC timezone."
}
---

## Description
The UTC_DATE function returns the current date in the UTC timezone. This function is not affected by the local timezone and always returns the current date based on the UTC timezone, ensuring date consistency across different timezone scenarios.

This function behaves consistently with the [utc_date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-date) in MySQL.

## Syntax

```sql
UTC_DATE()
```

## Return Value
Returns the current UTC date, with the type DATE.

Return Date type (format: YYYY-MM-DD). When performing numerical operations on the returned results, a type conversion will be performed, returning an [integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-date) (format: YYYYMMDD).

## Examples

```sql
-- Assume the current local time is UTC+8 2025-10-27 10:55:35
SELECT UTC_DATE(), UTC_DATE() + 0;
```
```text
+------------+----------------+
| UTC_DATE() | UTC_DATE() + 0 |
+------------+----------------+
| 2025-10-27 |       20251027 |
+------------+----------------+
```
