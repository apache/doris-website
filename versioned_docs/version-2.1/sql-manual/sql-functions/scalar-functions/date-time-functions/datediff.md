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
| `<expr1>` | The minuend date, support `datetime` or `date` type and `string` types that conform to the format |
| `<expr2>` | The subtrahend date, supporting date and datetime types |

## Return value

Returns the value of expr1 - expr2, with the result precise to the day.

Special cases:

- If any parameter is NULL, return NULL.
- If the input parameters are invalid (such as an incorrectly formatted date(e.g., 2022-2-32 13:21:03; for specific datetime formats, please refer to [cast to datetime](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion/) and [cast to date](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/date-conversion/))), the function returns NULL.

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

--- Contains an invalid date, returns NULL
mysql> select datediff('2023-02-30', '2023-01-01');
+--------------------------------------+
| datediff('2023-02-30', '2023-01-01') |
+--------------------------------------+
|                                 NULL |
+--------------------------------------+

-- Calculation across years
mysql> select datediff(cast('2024-03-01' as date), '2023-12-31');
+--------------------------------------+
| datediff('2024-03-01', '2023-12-31') |
+--------------------------------------+
|                                   61 |
+--------------------------------------+

---date is not int[0000-01-01,9999-12-31]之内，return null
mysql> select datediff(cast('20241-03-01' as date), '2023-12-31');
+-----------------------------------------------------+
| datediff(cast('20241-03-01' as date), '2023-12-31') |
+-----------------------------------------------------+
|                                                NULL |
+-----------------------------------------------------+

---it will ignore time part
select datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00');
+--------------------------------------------------------+
| datediff('2023-01-02 13:00:00', '2023-01-01 12:00:00') |
+--------------------------------------------------------+
|                                                      1 |
+--------------------------------------------------------+
```
