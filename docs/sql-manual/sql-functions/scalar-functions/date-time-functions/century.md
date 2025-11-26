---
{
    "title": "CENTURY",
    "language": "en"
}
---

## Description  
Returns the century of the given date.  
If the input is invalid or out of the supported range, it returns NULL.

## Syntax  
```sql
CENTURY(`<date_or_time_expr>`)
```

## Parameters
| Parameter     | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `<date_or_time_expr>` | The date or datetime expression to calculate the century for. |

## Return Value
Returns an integer (INT) representing the century of the input date. For example, the years 1901 to 2000 belong to the 20th century. Returns NULL if the input is NULL or an invalid date.

## Examples
```sql
-- Extract the century from a DATE type
SELECT CENTURY('2024-01-01') AS century_date;
+-----------------+
| century_date    |
+-----------------+
| 21              |
+-----------------+

-- Extract the century from a DATETIME type (ignoring hours, minutes, and seconds)
SELECT CENTURY('2024-05-20 14:30:25') AS century_datetime;
+----------------------+ 
| century_datetime     |
+----------------------+
| 21                   |
+----------------------+

-- Input is NULL (returns NULL)
SELECT CENTURY(NULL) AS null_input;
+----------------+
| null_input     |
+----------------+
| NULL           |
+----------------+

-- Invalid date input (returns NULL)
SELECT CENTURY('10000-01-01') AS invalid_date;
+-------------------+
| invalid_date      |
+-------------------+
| NULL              |
+-------------------+


```
