---
{
    "title": "LOCALTIME,LOCALTIMESTAMP",
    "language": "en"
}
---

## Description
The function is used to retrieve the current system time, and the return value is of the `DATETIME` type. You can optionally specify the precision to adjust the number of digits in the fractional seconds part of the return value.

This function behaves the same as MySQL’s [localtime function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_localtime).

## Syntax

```sql
LOCALTIME([`<precision>`])
LOCALTIMESTAMP([`<precision>`])
```

## Parameters

| Parameter       | Description                                                                                                                        |
|------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `<precision>`    | Optional parameter that specifies the precision of the fractional seconds part of the return value. The range is 0 to 6. The default is 0, meaning no fractional seconds are returned. <br/> Due to JDK implementation limitations, if the FE is built with JDK8, the precision is limited to milliseconds (3 decimal places), and higher precision values will be padded with zeros. For higher precision, use JDK11. |

## Return Value
- Returns the current system time, with the type `DATETIME`.
- If the specified `<precision>` is out of range (e.g., negative or greater than 6), the function will return an error.

## Examples

```sql

-- With JDK 17, supports up to six decimal places of precision
mysql> select LOCALTIME(), LOCALTIME(3), LOCALTIME(6);

+---------------------+-------------------------+----------------------------+
| LOCALTIME()         | LOCALTIME(3)           | LOCALTIME(6)               |
+---------------------+-------------------------+----------------------------+
| 2025-08-11 11:04:49 | 2025-08-11 11:04:49.535 | 2025-08-11 11:04:49.535992 |
+---------------------+-------------------------+----------------------------+

-- Input parameter is NULL, returns NULL
mysql> select LOCALTIME(NULL);
+-----------------+
| LOCALTIME(NULL) |
+-----------------+
| NULL            |
+-----------------+

-- Precision out of range, returns an error
mysql> select LOCALTIME(-1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: -1
mysql> select LOCALTIME(7);
ERROR 1105 (HY000): errCode = 2, detailMessage = Scale of Datetime/Time must between 0 and 6. Scale was set to: