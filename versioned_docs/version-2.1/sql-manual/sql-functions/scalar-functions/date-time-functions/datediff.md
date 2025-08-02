---
{
    "title": "DATEDIFF",
    "language": "en"
}
---

## Description

The DATEDIFF function is used to calculate the difference between two date or datetime values, with the result precise to the day. That is, it returns the number of days obtained by subtracting `expr2` from `expr1`. This function only focuses on the date part and ignores the specific hours, minutes, and seconds in the time part.

## Syntax

```sql
DATEDIFF(<expr1>, <expr2>)
```

## Parameter

| Parameter | Description |
| -- | -- |
| `<expr1>` | The minuend date, support `datetime` or `date` type and `string` types that conform to the format,for specific datetime formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion)) |
| `<expr2>` | The subtrahend date, supporting date and datetime types |

## Return value

Returns the value of expr1 - expr2, with the result precise to the day.

Special cases:

- If any parameter is NULL, return NULL.

## Example

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

--- Any parameter is NULL
mysql> select datediff('2023-01-01', NULL);
+------------------------------+
| datediff('2023-01-01', NULL) |
+------------------------------+
|                         NULL |
+------------------------------+

-- Calculation across years
mysql> select datediff(cast('2024-03-01' as date), '2023-12-31');
+--------------------------------------+
| datediff('2024-03-01', '2023-12-31') |
+--------------------------------------+
|                                   61 |
+--------------------------------------+


---it will ignore time part
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
```
