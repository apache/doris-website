---
{
    "title": "DATE",
    "language": "en"
}
---
## Description

The DATE function is used to extract the pure date part from a datetime value (which includes both date and time), ignoring the time information. This function can convert a DATETIME type into a DATE type, retaining only the year, month, and day information.

This function is consistent with the [date function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date) in MySQL.

## Syntax

```sql
DATE(<date_or_time_part>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | A valid date expression of type datetime, supporting datetime. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

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