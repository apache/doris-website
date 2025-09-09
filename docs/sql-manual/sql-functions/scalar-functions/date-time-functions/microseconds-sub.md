---
{
    "title": "MICROSECONDS_SUB",
    "language": "en"
}
---

## Description

The `MICROSECONDS_SUB` function subtracts a specified number of microseconds from the input datetime value and returns the resulting new datetime value. This function supports processing `DATETIME` types with microsecond precision.

This function behaves the same as MySQL’s [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) when using MICROSECOND as the unit.

## Syntax

```sql
MICROSECONDS_SUB(`<datetime>`, `<delta>`)
```

## Parameters

| Parameter    | Description                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| `<datetime>` | The input datetime value, of type `DATETIME`. For specific datetime formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion). |
| `<delta>`    | The number of microseconds to subtract, of type `INT`. 1 second = 1,000,000 microseconds.       |

## Return Value

Returns a value of type `DATETIME`, representing the result of subtracting the specified number of microseconds from the base time.

- If `<delta>` is negative, the function behaves the same as adding the corresponding number of microseconds to the base time (i.e., `MICROSECONDS_SUB(basetime, -n)` is equivalent to `MICROSECONDS_ADD(basetime, n)`).
- If the calculation result exceeds the valid range of the `DATETIME` type (`0000-01-01 00:00:00` to `9999-12-31 23:59:59.999999`), an exception is thrown.
- If any parameter is `NULL`, the function returns `NULL`.
- If `<delta>` exceeds the range of the `INT` type, the function returns `NULL`.

## Examples

```sql
-- Subtract microseconds
SELECT NOW(3) AS current_time, MICROSECONDS_SUB(NOW(3), 100000) AS after_sub;

+-------------------------+----------------------------+
| current_time            | after_sub                  |
+-------------------------+----------------------------+
| 2025-01-16 11:52:22.296 | 2025-01-16 11:52:22.196000 |
+-------------------------+----------------------------+

-- Negative delta (equivalent to addition)
mysql> SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.200000', -300000) AS after_sub;
+----------------------------+
| after_sub                  |
+----------------------------+
| 2023-10-01 12:00:00.500000 |
+----------------------------+

-- Any parameter is NULL, returns NULL
SELECT MICROSECONDS_SUB(NULL, 1000), MICROSECONDS_SUB('2023-01-01', NULL) AS after_sub;
+------------------------------+----------------------------+
| microseconds_sub(NULL, 1000) | after_sub                  |
+------------------------------+----------------------------+
| NULL                         | NULL                       |
+------------------------------+----------------------------+

-- Input type is DATE, time part is automatically set to 00:00:00.000000
SELECT MICROSECONDS_SUB('2023-10-01', -300000);
+-----------------------------------------+
| MICROSECONDS_SUB('2023-10-01', -300000) |
+-----------------------------------------+
| 2023-10-01 00:00:00.300000              |
+-----------------------------------------+

-- Exceeds datetime range, throws an error
mysql> SELECT MICROSECONDS_SUB('0000-01-01 00:00:00.000000', 1000000) AS after_sub;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation microseconds_sub of 0000-01-01 00:00:00, 1000000 
out of range

-- Delta parameter exceeds INT range, returns NULL
SELECT MICROSECONDS_SUB('2023-10-01 12:00:00.500000', 2147483648) AS after_sub;
+-----------+
| after_sub |
+-----------+
| NULL      |
+-----------+
```