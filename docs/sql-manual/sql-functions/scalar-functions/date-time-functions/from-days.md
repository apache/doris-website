---
{
    "title": "FROM_DAYS",
    "language": "en"
}
---

## Description

The FROM_DAYS function is used to convert an integer number of days to the corresponding date (DATE type). This function uses "January 1st, year 0" as the reference point (i.e., day 0 corresponds to 0000-01-01), calculating the date after the specified number of days from the reference date.

Note: To maintain behavioral consistency with MySQL, the FROM_DAYS function does not support "February 29th, year 0" (0000-02-29), even though theoretically this year conforms to leap year rules, this date will be automatically skipped.
Historical date limitation: This function calculates based on the extended Gregorian calendar, and is not suitable for dates before the Gregorian calendar was introduced in 1582 (when the Julian calendar was actually used), which may cause discrepancies between results and actual historical dates.

This function behaves consistently with the [from_days function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_from-days) in MySQL

## Syntax

```sql
FROM_DAYS(<days>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<days>` | Input number of days, of type `INT` |

## Return Value

Returns a DATE type value in the format YYYY-MM-DD, representing the date after days from the reference date (0000-01-01).
If days is negative, returns NULL.
If days exceeds the valid date range (typically 1 to 3652424, corresponding to approximately year 10000), returns an error.

## Examples

```sql

---Calculate days from the reference date
select from_days(730669),from_days(5),from_days(59), from_days(60);

+-------------------+--------------+---------------+---------------+
| from_days(730669) | from_days(5) | from_days(59) | from_days(60) |
+-------------------+--------------+---------------+---------------+
| 2000-07-03        | 0000-01-05   | 0000-02-28    | 0000-03-01    |
+-------------------+--------------+---------------+---------------+

---Input parameter is negative, returns NULL
select from_days(-60);

+----------------+
| from_days(-60) |
+----------------+
| NULL           |
+----------------+


---Input NULL, returns NULL
select from_days(NULL);
+-----------------+
| from_days(NULL) |
+-----------------+
| NULL            |
+-----------------+
```