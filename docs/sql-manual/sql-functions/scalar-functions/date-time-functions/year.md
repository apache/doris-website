---
{
    "title": "YEAR",
    "language": "en"
}
---

## Description
The YEAR function extracts the year part from a specified date or time value, returning the year as an integer. It supports processing DATE and DATETIME types.

This function behaves consistently with the [year function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_year) in MySQL.

## Syntax
```sql
YEAR(`<date_or_time_expr>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to extract year from, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |

## Return Value

Returns the year part of the date type, INT type, range from 0-9999.

- If the input parameter is NULL, returns NULL
- Invalid date returns NULL

## Examples

```sql
-- Extract year from DATE type
SELECT YEAR('1987-01-01') AS year_date;
+-----------+
| year_date |
+-----------+
|      1987 |
+-----------+

-- Extract year from DATETIME type (ignoring hours, minutes, seconds)
SELECT YEAR('2024-05-20 14:30:25') AS year_datetime;
+---------------+
| year_datetime |
+---------------+
|          2024 |
+---------------+

-- Invalid date (returns NULL)
SELECT YEAR('2023-02-30') AS invalid_date;
+--------------+
| invalid_date |
+--------------+
| NULL         |
+--------------+

-- Input is NULL (returns NULL)
SELECT YEAR(NULL) AS null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+
```
