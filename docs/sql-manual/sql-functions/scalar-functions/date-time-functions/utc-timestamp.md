---
{
    "title": "UTC_TIMESTAMP",
    "language": "en",
    "description": "The UTCTIMESTAMP function returns the current date and time in UTC timezone."
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
| `<precision>` | Optional integer constant in the range `[0, 9]`. The default is 0. |

## Return Value
Returns the current UTC date and time.

For precision 0 to 6, returns `DATETIME(<precision>)`. For precision 7 to 9, returns `TIMESTAMP_NS`, displayed with nine fractional digits. When using the returned result for numeric operations, it is converted to the [integer format](../../../../sql-manual/basic-element/sql-data-types/conversion/int-conversion#from-datetime) (format YYYYMMDDHHmmss). The value is constant within one statement.

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
SELECT UTC_TIMESTAMP(10);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of UTC_TIMESTAMP must be between 0 and 9. Precision was set to: 10

SELECT UTC_TIMESTAMP(NULL);
-- ERROR 1105 (HY000): errCode = 2, detailMessage = UTC_TIMESTAMP argument cannot be NULL.
```
