---
{
    "title": "DATEDIFF",
    "language": "en",
    "description": "The DATEDIFF function is used to calculate the difference between two date or datetime values, with the result precise to the day. That is,"
}
---

## Description

The DATEDIFF function is used to calculate the difference between two date or datetime values, with the result precise to the day. That is, it returns the number of days obtained by subtracting `expr2` from `expr1`. This function only focuses on the date part and ignores the specific hours, minutes, and seconds in the time part.

This function is consistent with the [datediff function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_datediff) in MySQL.

## Syntax

```sql
DATEDIFF(<expr1>, <expr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<expr1>` | The minuend date, supporting datetime or date type. For specific datetime and date formats, please refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<expr2>` | The subtrahend date, supporting date and datetime types |

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
