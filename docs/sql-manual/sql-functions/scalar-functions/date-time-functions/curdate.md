---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "en",
    "description": "Get the current date and return it as a DATE type."
}
---

## Description

Get the current date and return it as a DATE type.

This function is consistent with the [curdate function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curdate) in MySQL.

## Aliases

- current_date

## Syntax

```sql
CURDATE()
```

## Return Value

The current date, return value is of date type.

## Examples

```sql
-- Get the current date
SELECT CURDATE();

+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```