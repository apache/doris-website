---
{
    "title": "DAY",
    "language": "en"
}
---

## Description

The DAY function is used to extract the "day" part from a date or time expression, returning an integer value ranging from 1 to 31 (depending on the month and year).

This function behaves consistently with the [day function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_day) in MySQL

## Alias

- dayofmonth

## Syntax

```sql
DAY(<date_or_time_expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns integer information (1-31) for the "day" in the date.

Special cases:

If `dt` is NULL, returns NULL;

## Examples

```sql

--Extract day from DATE type
select day('1987-01-31');
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+

---Extract day from DATETIME type (ignoring time part)
select day('2023-07-13 22:28:18');
+----------------------------+
| day('2023-07-13 22:28:18') |
+----------------------------+
|                         13 |
+----------------------------+

---Input is NULL
select day(NULL);
+-----------+
| day(NULL) |
+-----------+
|      NULL |
+-----------+
```