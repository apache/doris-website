---
{
    "title": "LAST_DAY",
    "language": "en"
}
---

## Description

Returns the last day of the month that the input date falls in. Depending on the month, the last day is:

- 28th: February in a common (non‑leap) year
- 29th: February in a leap year
- 30th: April, June, September, November
- 31st: January, March, May, July, August, October, December

This function behaves the same as MySQL’s [LAST_DAY function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_last-day).

## Syntax

```sql
LAST_DAY(`<date_or_time_expr>`)
```

## Arguments

| Parameter | Description |
| --- | --- |
| `<date_or_time_expr>` | A valid date expression. Supports `DATE`/`DATETIME` types. For exact formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Return value

Returns a value of type `DATE`, representing the last day of the month of the input date (format `YYYY-MM-DD`).

- If the input is `NULL`, returns `NULL`.

## Examples

```sql
-- Input is DATE; returns the last day of February in a leap year
mysql> SELECT LAST_DAY('2000-02-03');
+------------------------+
| LAST_DAY('2000-02-03') |
+------------------------+
| 2000-02-29             |
+------------------------+

-- Input is DATETIME; time part is ignored
mysql> SELECT LAST_DAY('2023-04-15 12:34:56');
+---------------------------------+
| LAST_DAY('2023-04-15 12:34:56') |
+---------------------------------+
| 2023-04-30                      |
+---------------------------------+

-- February in a common (non‑leap) year
mysql> SELECT LAST_DAY('2021-02-01');
+------------------------+
| LAST_DAY('2021-02-01') |
+------------------------+
| 2021-02-28             |
+------------------------+

-- Example of a 31‑day month
mysql> SELECT LAST_DAY('2023-01-10');
+------------------------+
| LAST_DAY('2023-01-10') |
+------------------------+
| 2023-01-31             |
+------------------------+

-- Input is NULL; returns NULL
mysql> SELECT LAST_DAY(NULL);
+----------------+
| LAST_DAY(NULL) |
+----------------