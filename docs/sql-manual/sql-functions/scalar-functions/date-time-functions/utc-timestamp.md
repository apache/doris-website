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

Returns DATETIME type (format: YYYY-MM-DD HH:mm:ss[.ssssss]). When using the returned result for numeric operations, it will be converted to the [integer format](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime) (format YYYYMMDDHHmmss).

When the input is NULL or the precision is out of range, an error will be thrown.

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

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
