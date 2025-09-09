---
{
    "title": "MONTHNAME",
    "language": "en"
}
---

## Description

The MONTHNAME function returns the English month name corresponding to a datetime value. This function supports processing DATE and DATETIME types, returning the full English month name (January to December).

This function behaves the same as MySQL's [monthname function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_monthname).

## Syntax

```sql
MONTHNAME(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Return Value

Returns a value of type VARCHAR, representing the English name of the month:
- Return value range: January, February, March, April, May, June, July, August, September, October, November, December
- If the input is NULL, returns NULL
- Return value has the first letter capitalized and the rest in lowercase

## Examples

```sql
-- Get English month name from DATE type
SELECT MONTHNAME('2008-02-03') AS result;
+----------+
| result   |
+----------+
| February |
+----------+

-- Get English month name from DATETIME type
SELECT MONTHNAME('2023-07-13 22:28:18') AS result;
+---------+
| result  |
+---------+
| July    |
+---------+

-- Returns NULL when input is NULL
SELECT MONTHNAME(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
