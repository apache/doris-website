---
{
    "title": "UTC_TIMESTAMP",
    "language": "en"
}
---

## Description
The UTC_TIMESTAMP function returns the current date and time in UTC timezone. This function is not affected by local timezone and always returns the current time based on UTC timezone, ensuring time consistency across different timezone scenarios.

This function behaves consistently with the [utc_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_utc-timestamp) in MySQL.

## Syntax

```sql
UTC_TIMESTAMP([`<precision>`])
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<precision>` | The precision of the returned date-time value supports integer types within the range [0, 6]. Only integer type constants are accepted.。 |

## Return Value
Returns the current UTC date and time.

Depending on the use case, the return type may be a DATETIME type (format: YYYY-MM-DD HH:mm:ss[.ssssss]) or an integer type (format: YYYYMMDDHHmmss, milliseconds will be automatically discarded during type conversion).

## Examples

```sql
-- Current local time is UTC+8 2025-10-27 14:43:21
SELECT UTC_TIMESTAMP(), UTC_TIMESTAMP() + 0, UTC_TIMESTAMP(5), UTC_TIMESTAMP(5) + 0;
```
```text
+---------------------+---------------------+---------------------------+----------------------+
| UTC_TIMESTAMP()     | UTC_TIMESTAMP() + 0 | UTC_TIMESTAMP(5)          | UTC_TIMESTAMP(5) + 0 |
+---------------------+---------------------+---------------------------+----------------------+
| 2025-10-27 06:43:21 |      20251027064321 | 2025-10-27 06:43:21.88177 |       20251027064321 |
+---------------------+---------------------+---------------------------+----------------------+
```

```sql
SELECT UTC_TIMESTAMP(7);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = scale must be between 0 and 6
```
