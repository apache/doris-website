---
{
    "title": "HOURS_SUB",
    "language": "en",
    "description": "The HOURSSUB function subtracts a specified number of hours from an input date or datetime value and returns the calculated new datetime."
}
---

## Description

The HOURS_SUB function subtracts a specified number of hours from an input date or datetime value and returns the calculated new datetime. This function supports both DATE, DATETIME and TIMESTAMPTZ input types. If the input is DATE type (containing only year, month, day), it defaults the time part to 00:00:00.

This function is consistent with the [date_sub function](./date-sub) and [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) in MySQL when using the `HOUR` unit.

## Syntax

```sql
HOURS_SUB(`<date_or_time_expr>`, `<hours>`)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime/timestamptz types. For specific formats, please refer to [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<hours>` | The number of hours to subtract, of INT type |

## Return Value

Return the base time `<date_or_time_expr>` minus the specified hours `<hours>`, the return value type is determined by the type of the first parameter:
- If the type of the first parameter is DATE/DATETIME, then the return type is DATETIME.
- If the type of the first parameter is TIMESTAMPTZ, then the return type is TIMESTAMPTZ

Special cases:
- If the calculation result exceeds the valid range of DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59), returns an error.
- If any input parameter is NULL, returns NULL.
- If input hours is negative, returns the datetime plus the corresponding number of hours.

## Examples

```sql

-- Subtract positive hours
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+

-- Subtract hours from date type
select hours_sub('2023-10-01', 12);
+-----------------------------+
| hours_sub('2023-10-01', 12) |
+-----------------------------+
| 2023-09-30 12:00:00         |
+-----------------------------+

-- Input hours is negative, returns datetime plus hours
select hours_sub('2023-10-01 10:00:00', -3);
+--------------------------------------+
| hours_sub('2023-10-01 10:00:00', -3) |
+--------------------------------------+
| 2023-10-01 13:00:00                  |
+--------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1);
+-----------------------------------------------+
| HOURS_SUB('2025-10-10 11:22:33.123+07:00', 1) |
+-----------------------------------------------+
| 2025-10-10 11:22:33.123+08:00                 |
+-----------------------------------------------+

-- Any parameter is NULL, return NULL
select hours_sub('2023-10-01 10:00:00', NULL);
+----------------------------------------+
| hours_sub('2023-10-01 10:00:00', NULL) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+

-- Exceeds datetime range, return NULL
mysql> select hours_sub('9999-12-31 12:00:00', -20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 9999-12-31 12:00:00, 20 out of range

mysql> select hours_sub('0000-01-01 12:00:00', 20);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation hours_add of 0000-01-01 12:00:00, -20 out of range
```
