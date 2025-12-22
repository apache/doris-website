---
{
    "title": "UTC_TIME",
    "language": "en",
    "description": "The UTCTIME function returns the current time in the UTC timezone."
}
---

## Description
The UTC_TIME function returns the current time in the UTC timezone. This function is not affected by the local timezone and always returns the current time based on the UTC timezone, ensuring time consistency across different timezone scenarios.

This function behaves consistently with the [utc_time function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-time) in MySQL.

## Syntax

```sql
UTC_TIME([<`precision`>])
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<precision>` | The precision of the returned time value supports integer types within the range [0, 6]. Only integer type constants are accepted. |

## Return Value
Returns the current UTC time.

Return Time type (format: HH:mm:ss). When using the returned result for numerical operations, it will be converted to [integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from--time) (the time value elapsed since 00:00:00, unit in microseconds).

When the input is NULL or the precision is out of range, an error will be thrown.

## Examples

```sql
-- Assume the current local time is UTC+8 2025-10-27 14:39:01
SELECT UTC_TIME(), UTC_TIME() + 1, UTC_TIME(6), UTC_TIME(6) + 1;
```
```text
------------+----------------+-----------------+-----------------+
| UTC_TIME() | UTC_TIME() + 1 | UTC_TIME(6)     | UTC_TIME(6) + 1 |
+------------+----------------+-----------------+-----------------+
| 06:39:01   |    23941000001 | 06:39:01.934119 |     23941934120 |
+------------+----------------+-----------------+-----------------+
```

```sql
SELECT UTC_TIME(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6

SELECT UTC_TIME(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIME argument cannot be NULL.
```
