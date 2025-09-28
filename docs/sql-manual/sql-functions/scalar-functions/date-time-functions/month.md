---
{
    "title": "MONTH",
    "language": "en"
}
---

## Description

The MONTH function extracts the month value from a datetime value. The return value ranges from 1 to 12, representing the 12 months of a year. This function supports processing DATE and DATETIME types.

This function behaves the same as MySQL's [month function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_month).

## Syntax

```sql
MONTH(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The input datetime value. Supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |

## Return Value

Returns a value of type TINYINT, representing the month value:
- Range: 1 to 12
- 1 represents January, 12 represents December
- If the input is NULL, returns NULL

## Examples

```sql
-- Extract month from DATE type
SELECT MONTH('1987-01-01') AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Extract month from DATETIME type
SELECT MONTH('2023-07-13 22:28:18') AS result;
+--------+
| result |
+--------+
|      7 |
+--------+

-- Extract month from DATETIME with fractional seconds
SELECT MONTH('2023-12-05 10:15:30.456789') AS result;
+--------+
| result |
+--------+
|     12 |
+--------+

-- Returns NULL when input is NULL
SELECT MONTH(NULL) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
