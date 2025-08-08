---
{
    "title": "DATE",
    "language": "en"
}
---
## Description

The DATE function is used to extract the pure date part from a datetime value (which includes both date and time), ignoring the time information. This function can convert a DATETIME type or a time-containing string into a DATE type, retaining only the year, month, and day information.

## Syntax

```sql
DATE(<datetime>)
```

## Parameter

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression of type datetime,support `datetime` or `date` type and `string` types that conform to the format |

## Return value

If the input is valid, it returns a pure date value of DATE type (in the format YYYY-MM-DD), without the time part.

Special cases:

- Returns NULL when the input is NULL;
- If the input parameters are invalid (such as an invalid datetime format (e.g., 2022-2-32 13:21:03; for specific datetime formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion))), the function returns NULL.

## Example

```sql
--- Extract the date part from a datetime
mysql> select date(cast('2010-12-02 19:28:30' as datetime));
+-----------------------------------------------+
| date(cast('2010-12-02 19:28:30' as datetime)) |
+-----------------------------------------------+
| 2010-12-02                                    |
+-----------------------------------------------+


--- Extract the date part from a date
mysql> select date(cast('2015-11-02' as date));
+----------------------------------+
| date(cast('2015-11-02' as date)) |
+----------------------------------+
| 2015-11-02                       |
+----------------------------------+

-- Supports datetime strings with different separators (for specific supported date formats, please refer to the date type documentation)
mysql> select date('2023/04/01 08:30:00');
+-----------------------------+
| date('2023/04/01 08:30:00') |
+-----------------------------+
| 2023-04-01                  |
+-----------------------------+

--- Input is NULL
mysql> select date(NULL);
+------------+
| date(NULL) |
+------------+
| NULL       |
+------------+


---date is not in the range of [0000-01-01,9999-12-31],return null
mysql> select date('20232-02-13 12:00:00');
+------------------------------+
| date('20232-02-13 12:00:00') |
+------------------------------+
| NULL                         |
+------------------------------+
```