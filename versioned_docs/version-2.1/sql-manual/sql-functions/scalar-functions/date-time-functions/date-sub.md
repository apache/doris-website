---
{
    "title": "DATE_SUB",
    "language": "en"
}
---

## Description

The DATE_SUB function is used to subtract a specified time interval from a given date or time value and return the calculated date or time result. It supports operations on DATE (date only) and DATETIME (date and time) types, where the time interval is defined by both a numerical value and a unit.

This function behaves generally consistently with the [date_sub function](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_date-sub) in MySQL, but the difference is that MySQL supports compound unit additions and subtractions, such as:

```sql
SELECT DATE_SUB('2025-01-01 00:00:00',INTERVAL '1 1:1:1' DAY_SECOND);
        -> '2024-12-30 22:58:59'
```
Doris does not support this type of input.

## Aliases

- days_sub
- date_sub
- subdate

## Syntax

```sql
DATE_SUB(<date>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_part>` | A valid date value, supporting datetime or date type. For specific datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<expr>` | The time interval to be subtracted, of type `INT` |
| `<time_unit>` | Enumerated values: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns a calculated result with the same type as date:
- When input is DATE, returns DATE (date part only);
- When input is DATETIME, returns DATETIME (including date and time).
- For datetime types with scale, the scale will be preserved and returned.

Special cases:
- Returns NULL if any parameter is NULL;
- Returns NULL for illegal expr (negative values) or time_unit;
- Returns an error if the calculated result is earlier than the minimum value supported by the date type (e.g., before '0000-01-01').

## Examples

```sql
-- Subtract two days
mysql> select date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------------------------+
| date_sub(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-11-28 23:59:59                                               |
+-------------------------------------------------------------------+

-- Parameter with scale, return preserves scale
mysql> select date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND);
+------------------------------------------------------+
| date_sub('2010-11-30 23:59:59.6', INTERVAL 4 SECOND) |
+------------------------------------------------------+
| 2010-11-30 23:59:55.6                                |
+------------------------------------------------------+

-- Subtract two months across years
mysql> select date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH);
+--------------------------------------------------------+
| date_sub(cast('2023-01-15' as date), INTERVAL 2 MONTH) |
+--------------------------------------------------------+
| 2022-11-15                                             |
+--------------------------------------------------------+

-- February 2023 has only 28 days, so subtracting one month from 2023-03-31 results in 2023-02-28
mysql> select date_sub('2023-03-31', INTERVAL 1 MONTH);
+------------------------------------------+
| date_sub('2023-03-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Subtract 61 seconds
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND);
+-----------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 SECOND) |
+-----------------------------------------------------+
| 2023-12-31 23:58:58                                 |
+-----------------------------------------------------+

-- Subtract quarters
mysql> select date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER);
+------------------------------------------------------+
| date_sub('2023-12-31 23:59:59', INTERVAL 61 QUARTER) |
+------------------------------------------------------+
| 2008-09-30 23:59:59                                  |
+------------------------------------------------------+

-- Any parameter is NULL
mysql> select date_sub('2023-01-01', INTERVAL NULL DAY);
+-------------------------------------------+
| date_sub('2023-01-01', INTERVAL NULL DAY) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+

-- Exceeds minimum date
mysql> select date_sub('0000-01-01', INTERVAL 1 DAY);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation days_sub of 0000-01-01, 1 out of range

select date_sub('9999-01-01', INTERVAL -1 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation years_sub of 9999-01-01, -1 out of range
```