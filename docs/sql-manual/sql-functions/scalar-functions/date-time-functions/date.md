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
| `<datetime>` | A valid date expression of type datetime |

## Return value

If the input is valid, it returns a pure date value of DATE type (in the format YYYY-MM-DD), without the time part.

Special cases:

- Returns NULL when the input is NULL;
- Returns NULL when the input is an invalid datetime (such as incorrect format or out of range).

## Example

```sql
--- Extract the date part from a datetime
mysql> select date('2010-12-02 19:28:30');
+-----------------------------+
| date('2010-12-02 19:28:30') |
+-----------------------------+
| 2010-12-02                  |
+-----------------------------+

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

--- Invalid date
mysql> select date('2023-02-30 12:00:00');
+-----------------------------+
| date('2023-02-30 12:00:00') |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> select date('0000-00-00 12:00:00');
+-----------------------------+
| date('0000-00-00 12:00:00') |
+-----------------------------+
| NULL                        |
+-----------------------------+

```