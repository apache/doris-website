---
{
    "title": "TO_DAYS",
    "language": "en"
}
---

## Description
Date calculation function, which is used to convert a date into a day value, that is, to calculate the total number of days from December 31, 0 AD (the base date) to the specified date.

## Syntax

```sql
TO_DAYS(<datetime_or_date_value>)
```

## Required parameters
| Parameter                  | Description                       |
|----------------------------|-----------------------------------|
| `<datetime_or_date_value>` | `datetime` or `date` type date-time |

## Example

Query how many days are there since October 7, 2007
```sql
select to_days('2007-10-07');
```
```text
+---------------------------------------+
| to_days(cast('2007-10-07' as DATEV2)) |
+---------------------------------------+
|                                733321 |
+---------------------------------------+
```

```sql
select to_days('2007-10-07 10:03:09');
```
```text
+------------------------------------------------+
| to_days(cast('2007-10-07 10:03:09' as DATEV2)) |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```
