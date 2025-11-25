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
SELECT CENTURY('2024-01-01');
+-------------------------+
| CENTURY('2024-01-01')   |
+-------------------------+
| 21                      |
+-------------------------+

SELECT CENTURY('1999-12-31') AS century_of_date;
+----------------------+
| century_of_date      |
+----------------------+
| 20                   |
+----------------------+

SELECT CENTURY(NULL);
+------------------+
| CENTURY(NULL)    |
+------------------+
| NULL             |
+------------------+

```
