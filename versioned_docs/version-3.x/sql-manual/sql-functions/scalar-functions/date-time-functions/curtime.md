---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "en",
    "description": "Retrieves the current time and returns it as a TIME type."
}
---

## Description

Retrieves the current time and returns it as a TIME type.

## Alias

- CURTIME
- CURRENT_TIME

## Syntax

```sql
CURTIME()
```

## Return Value

Returns the current time.

## Examples

```sql
mysql> select current_time();
```

```text
+----------------+
| current_time() |
+----------------+
| 15:25:47       |
+----------------+
```