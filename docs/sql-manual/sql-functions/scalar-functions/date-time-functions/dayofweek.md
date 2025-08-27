---
{
    "title": "DAYOFWEEK",
    "language": "en"
}
---

## Description

The DAYOFWEEK function is used to return the weekday index value corresponding to a date or time expression, following the rule where Sunday is 1, Monday is 2, ..., and Saturday is 7.

This function behaves consistently with the [dayofweek function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_dayofweek) in MySQL

## Syntax

```sql
DAYOFWEEK(<date_or_time_expr>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)) |

## Return Value

Returns an integer representing the weekday index value corresponding to the date (1-7, where 1 represents Sunday and 7 represents Saturday).

Special cases:

If `<date_or_time_expr>` is NULL, returns NULL;

## Examples

```sql
---Calculate weekday index value for date type
select dayofweek('2019-06-25');

+----------------------------------+
| dayofweek('2019-06-25 00:00:00') |
+----------------------------------+
|                                3 |
+----------------------------------+

---Calculate weekday index value for datetime type
select dayofweek('2019-06-25 15:30:45');

+----------------------------------+
| dayofweek('2019-06-25 15:30:45') |
+----------------------------------+
|                                3 |
+----------------------------------+
---Index for Sunday
select dayofweek('2024-02-18');
+-------------------------+
| dayofweek('2024-02-18') |
+-------------------------+
|                       1 |
+-------------------------+

---Input datetime is NULL, returns NULL
select dayofweek(NULL);
+-----------------+
| dayofweek(NULL) |
+-----------------+
|            NULL |
+-----------------+
```