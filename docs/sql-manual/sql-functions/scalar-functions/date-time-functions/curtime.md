---
{
    "title": "CURTIME,CURRENT_TIME",
    "language": "en"
}
---

## Description

Retrieves the current time and returns it as a TIME type.

This function is consistent with the [curtime function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_curtime) in MySQL.

## Aliases

- CURTIME
- CURRENT_TIME

## Syntax

```sql
CURTIME()
```

## Return Value

Returns the current time type of TIME.

## Examples

```sql
mysql> select current_time();

+----------------+
| current_time() |
+----------------+
| 15:25:47       |
+----------------+
```