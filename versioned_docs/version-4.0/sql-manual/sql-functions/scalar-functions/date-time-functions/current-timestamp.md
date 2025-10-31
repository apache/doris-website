---
{
    "title": "CURRENT_TIMESTAMP",
    "language": "en"
}
---

## Description
This function is used to get the current system time and returns a datetime type (`DATETIME`). You can optionally specify precision to adjust the number of digits in the fractional seconds part of the return value.

This function is consistent with the [current_timestamp function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_current-timestamp) in MySQL.

## Alias

- NOW()

## Syntax

```sql
CURRENT_TIMESTAMP([<precision>])
```

## Parameters

| Parameter     | Description                                                                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>` | Optional parameter indicating the precision of the fractional seconds part of the return value, ranging from 0 to 6. Default is 0, which means no fractional seconds part is returned. |

## Return Value
- Returns the current system time as `DATETIME` type
- If the specified `<precision>` is out of range (such as negative or greater than 6), the function will return an error.

## Examples

```sql
-- Return different scale
select CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(6);

+---------------------+-------------------------+----------------------------+
| now()               | now(3)                  | now(6)                     |
+---------------------+-------------------------+----------------------------+
| 2025-01-23 11:26:01 | 2025-01-23 11:26:01.771 | 2025-01-23 11:26:01.771000 |
+---------------------+-------------------------+----------------------------+

---Return NULL if input NULL
select CURRENT_TIMESTAMP(NULL);
+-------------------------+
| CURRENT_TIMESTAMP(NULL) |
+-------------------------+
| NULL                    |
+-------------------------+

--input out of precision range, return error
select CURRENT_TIMESTAMP(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1

select CURRENT_TIMESTAMP(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: 7
```