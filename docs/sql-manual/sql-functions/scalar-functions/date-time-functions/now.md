---
{
    "title": "NOW",
    "language": "en"
}
---

## Description

The `NOW` function is used to get the current system date and time, returning a value of type `DATETIME`. It supports an optional parameter to specify the precision of fractional seconds, adjusting the number of microsecond digits in the returned result.

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
| `<precision>` | Optional parameter indicating the precision of the fractional seconds part of the return value, with a range from 0 to 6. Default is 0, meaning no fractional seconds are returned. `<br/>`Due to JDK implementation limitations, if users build FE with JDK8, precision is only supported up to milliseconds (three digits after the decimal point), and higher precision digits will be filled with zeros. For higher precision requirements, please use JDK11. |

## Return Value

Returns the current system time, of type `DATETIME`.
- If the specified `<precision>` is out of range (e.g., negative or greater than 6), the function returns an error.

## Examples

```sql
---Get current time
select NOW(),NOW(3),NOW(6);
+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:08:35 | 2025-01-23 11:08:35.561 | 2025-01-23 11:08:35.562000 |
+---------------------+-------------------------+----------------------------+

--- Invalid precision (out of range, error)
SELECT NOW(7) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = Invalid precision for NOW function. Precision must be between 0 and 6.

select NOW(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
```