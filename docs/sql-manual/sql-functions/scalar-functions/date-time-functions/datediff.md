---
{
    "title": "DATEDIFF",
    "language": "en",
    "description": "Calculates the day difference between two DATE, DATETIME, or TIMESTAMP_NS values."
}
---

## Description

The DATEDIFF function calculates the difference between two `DATE`, `DATETIME`, or `TIMESTAMP_NS` values, with the result precise to the day. It returns the number of days obtained by subtracting `expr2` from `expr1`. This function only uses the date part and ignores the hours, minutes, seconds, and fractional seconds in the time part.

This function is consistent with the [datediff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_datediff) in MySQL.

## Syntax

```sql
DATEDIFF(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The minuend date. Supports `DATE`, `DATETIME`, and `TIMESTAMP_NS`. For specific formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<expr2>` | The subtrahend date. Supports `DATE`, `DATETIME`, and `TIMESTAMP_NS`. |

## Return Value

Returns the value of expr1 - expr2, with the result precise to the day, type is INT.

Special cases:
- expr1 greater than expr2 returns positive number, otherwise returns negative number
- If any parameter is NULL, return NULL.
- Ignores time part

## Examples

```sql
-- The two dates differ by 1 day (ignoring the time part)
select datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2007-12-31 23:59:59' AS DATETIME), CAST('2007-12-30' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                                 1 |
+-----------------------------------------------------------------------------------+

-- The first date is earlier than the second date, returning a negative number
select datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME));
+-----------------------------------------------------------------------------------+
| datediff(CAST('2010-11-30 23:59:59' AS DATETIME), CAST('2010-12-31' AS DATETIME)) |
+-----------------------------------------------------------------------------------+
|                                                                               -31 |
+-----------------------------------------------------------------------------------+

-- TIMESTAMP_NS can be used for either parameter
SELECT DATEDIFF(CAST('2024-01-02 00:00:00.000000001' AS TIMESTAMP_NS),
                CAST('2024-01-01 23:59:59.999999' AS DATETIME(6))) AS result;
+--------+
| result |
+--------+
|      1 |
+--------+

-- Any parameter is NULL
mysql> select datediff('2023-01-01', NULL);
+------------------------------+
| datediff('2023-01-01', NULL) |
+------------------------------+
|                         NULL |
+------------------------------+

-- If input datetime type, will ignore time part
select datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+

select datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 12:00:00', '2023-01-01 13:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
1 row in set (0.01 sec)
```
