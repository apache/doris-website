---
{
    "title": "CURDATE,CURRENT_DATE",
    "language": "en",
    "description": "Retrieves the current date and returns it as a DATE type."
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

The current date.

## Examples 

```sql
SELECT CURDATE();
```

```text
+------------+
| CURDATE()  |
+------------+
| 2019-12-20 |
+------------+
```

```sql
SELECT CURDATE() + 0;
```

```text
+---------------+
| CURDATE() + 0 |
+---------------+
|      20191220 |
+---------------+
```