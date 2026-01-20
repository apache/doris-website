---
{
    "title": "MICROSECONDS_ADD",
    "language": "en",
    "description": "The MICROSECONDSADD function adds a specified number of microseconds to the input datetime value and returns the resulting new datetime value."
}
---

## Description

The MICROSECONDS_ADD function adds a specified number of microseconds to the input datetime value and returns the resulting new datetime value. This function supports processing DATETIME or TIMESTAMPTZ types with microsecond precision.

This function behaves the same as MySQL’s [date_add function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-add) when using MICROSECOND as the unit.

## Syntax

```sql
MICROSECONDS_ADD(`<datetime_like_type>`, `<delta>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime_like_type>` | The input datetime value, of type DATETIME or TIMESTAMPTZ. For formats, see [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |
| `<delta>` | The number of microseconds to add, of type BIGINT. 1 second = 1,000,000 microseconds. |

## Return Value

Return the result of adding the specified microseconds `<delta>` to the base time `<datetime_like_type>`, with the return type being the same as the type of the first parameter.
- If the first parameter is TIMESTAMPTZ, then return TIMESTAMPTZ.
- If the first parameter is DATETIME, then return DATETIME.

- If `<delta>` is negative, the function subtracts the corresponding microseconds from the base time (i.e., MICROSECONDS_ADD(basetime, -n) is equivalent to MICROSECONDS_SUB(basetime, n)).
- If the calculation result exceeds the valid range of the DATETIME type (0000-01-01 00:00:00 to 9999-12-31 23:59:59.999999), an exception is thrown.
- If any parameter is NULL, returns NULL.

## Examples

```sql
-- Add microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_ADD(NOW(3), 100000000) AS after_add;

+-------------------------+----------------------------+
| current_time            | after_add                  |
+-------------------------+----------------------------+
| 2025-08-11 14:49:16.368 | 2025-08-11 14:50:56.368000 |
+-------------------------+----------------------------+

-- Add negative microseconds, equivalent to subtracting
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', -300000) AS after_add;
+----------------------------+
| after_add                  |
+----------------------------+
| 2023-10-01 12:00:00.200000 |
+----------------------------+

-- Input type is date, time part defaults to 00:00:00.000000
SELECT MICROSECONDS_ADD('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_ADD('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-09-30 23:59:59.700000              |
+-----------------------------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
SELECT MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800');
+-------------------------------------------------------------+
| MICROSECONDS_ADD('2024-12-25 12:34:56.123+04:00', '765800') |
+-------------------------------------------------------------+
| 2024-12-25 16:34:56.888800+08:00                            |
+-------------------------------------------------------------+

-- Calculation result exceeds datetime range, throws error
SELECT MICROSECONDS_ADD('9999-12-31 23:59:59.999999', 2000000) AS after_add;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_add of 9999-12-31 23:59:59.999999, 2000000 out of range

-- Any input parameter is NULL, returns NULL
SELECT MICROSECONDS_ADD('2023-10-01 12:00:00.500000', NULL);
+-----------------------------------------------------+
| MICROSECONDS_ADD('2023-10-01 12:00:00.500000',NULL) |
+-----------------------------------------------------+
| NULL                                                |
+-----------------------------------------------------+

```