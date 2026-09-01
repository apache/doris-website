---
{
    "title": "DATE | Date Time Functions",
    "language": "en",
    "description": "Extracts the date part from a DATETIME or TIMESTAMP_NS value and ignores its time and fractional-second fields.",
    "sidebar_label": "DATE"
}
---

# DATE

## Description

The DATE function extracts the date part from a `DATETIME` or `TIMESTAMP_NS` value and ignores the time and fractional-second fields.

This function is consistent with the [date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) in MySQL.

## Syntax

```sql
DATE(<date_or_time_part>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | A `DATETIME` or `TIMESTAMP_NS` expression. |

## Return Value

If the input is valid, it returns a pure date value of DATE type (in the format YYYY-MM-DD), without the time part.
Special cases:
- Returns NULL when the input is NULL;

## Examples

```sql
-- Extract the date part from a datetime
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+

-- Extract the date part from a date
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

-- Input is NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+

```
