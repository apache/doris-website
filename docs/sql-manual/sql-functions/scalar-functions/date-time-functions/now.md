---
{
    "title": "NOW",
    "language": "en",
    "description": "The NOW function returns the current system date and time with an optional precision from 0 to 9."
}
---

## Description

The `NOW` function returns the current system date and time. It supports an optional parameter that specifies fractional-second precision from 0 to 9.

This function is consistent with MySQL's [now function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_now).

# Alias
- current_timestamp()

## Syntax

```sql
NOW([`<precision>`])
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<precision>` | Optional integer constant in the range `[0, 9]`. The default is 0. Values from 0 to 6 return the corresponding `DATETIME(p)` precision; values from 7 to 9 return `TIMESTAMP_NS`. The actual clock resolution depends on the operating system and JDK, so unavailable low-order digits are zero. |

## Return Value

Returns the current system time. For `<precision>` from 0 to 6, the return type is `DATETIME(<precision>)`. For `<precision>` from 7 to 9, the return type is `TIMESTAMP_NS`, displayed with nine fractional digits. The value is constant within one statement.

- If `<precision>` is negative or greater than 9, the function returns an error.

## Examples

```sql
---Get current time
select NOW(), NOW(3), NOW(6), NOW(9);
+---------------------+-------------------------+----------------------------+-------------------------------+
| now()               | now(3)                  | now(6)                     | now(9)                        |
+---------------------+-------------------------+----------------------------+-------------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.561000 | 2025-01-23 11:08:35.561000000 |
+---------------------+-------------------------+----------------------------+-------------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(10) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: 10

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Precision of NOW must be between 0 and 9. Precision was set to: -1
```
