---
{
    "title": "DAYNAME",
    "language": "en"
}
---

## Description

The DAYNAME function is used to calculate the name of the day (such as "Tuesday", etc.) corresponding to a date or time expression, returning a string type value.

This function behaves consistently with the [dayname function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayname) in MySQL

## Syntax

```sql
DAYNAME(<date_or_time_expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types and strings in date-time format. For specific datetime and date formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)) |

## Return Value

Returns the day name corresponding to the date (string type)

Special cases:

- If `date_or_time_expr` is NULL, returns NULL;

## Examples

```sql

---Calculate day name corresponding to DATETIME type
select dayname('2007-02-03 00:00:00');

+--------------------------------+
| dayname('2007-02-03 00:00:00') |
+--------------------------------+
| Saturday                       |
+--------------------------------+

---Calculate day name corresponding to DATE type

select dayname('2023-10-01');
+-----------------------+
| dayname('2023-10-01') |
+-----------------------+
| Sunday                |
+-----------------------+


---Parameter is NULL, returns NULL
select dayname(NULL);
+---------------+
| dayname(NULL) |
+---------------+
| NULL          |
+---------------+
```