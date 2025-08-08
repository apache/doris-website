---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "en"
}
---

## Description

Retrieves the current date and returns it as a DATE type.

## Alias

- curdate
- current_date

## Syntax

```sql
CURDATE()
```

## Return Value

The current date,it is `date` type.

## Examples 

```sql
------Get the current date
SELECT CURDATE();
```

```text
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```