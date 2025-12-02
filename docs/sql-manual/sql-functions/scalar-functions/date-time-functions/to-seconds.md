---
{
  "title": "TO_SECONDS",
  "language": "en"
}
---

## Description

Seconds calculation function. It converts a date to a seconds value, calculating the total seconds from the base date (0000-00-00) to the specified date.

This function behaves consistently with the [to_seconds function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_to-seconds) in MySQL.

## Syntax

```sql
TO_SECONDS(`<date_or_time_expr>`)
```

## Parameters

| Parameter             | Description                                                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<date_or_time_expr>` | The input date/time value. Supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../basic-element/sql-data-types/conversion/date-conversion). |

## Examples

```sql
select to_seconds('2025-01-01'), to_seconds(20250101);
+--------------------------+----------------------+
| to_seconds('2025-01-01') | to_seconds(20250101) |
+--------------------------+----------------------+
|              63902908800 |          63902908800 |
+--------------------------+----------------------+

SELECT
    to_seconds('2025-01-01 11:22:33') AS datetime_type,
    to_seconds(20250101112233) AS int_type;
+---------------+-------------+
| datetime_type | int_type    |
+---------------+-------------+
|   63902949753 | 63902949753 |
+---------------+-------------+

SELECT to_seconds(NULL);
+------------------+
| to_seconds(NULL) |
+------------------+
|             NULL |
+------------------+
```
