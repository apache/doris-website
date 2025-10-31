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

- CURRENT_TIME

## Syntax

```sql
CURTIME([<precision>])
```

## Parameters

| Parameter     | Description                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | Optional parameter indicating the precision of the fractional seconds part of the return value, must be a constant value ranging from 0 to 6. Default is 0, which means no fractional seconds part is returned. |

## Return Value

Returns the current time type of TIME.

## Examples

```sql
mysql> select curtime();

+----------------+
| curtime()      |
+----------------+
| 15:25:47       |
+----------------+
```

```sql
mysql> select curtime(0);
+------------+
| curtime(0) |
+------------+
| 13:15:27   |
+------------+
```

```sql
mysql> select curtime(4);
+---------------+
| curtime(4)    |
+---------------+
| 15:31:03.8958 |
+---------------+
```

```sql
mysql> select curtime(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = The precision must be between 0 and 6
```