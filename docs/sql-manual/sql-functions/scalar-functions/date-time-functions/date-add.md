---
{
    "title": "DATE_ADD",
    "language": "en",
    "description": "The DATEADD function is used to add a specified time interval to a specified date or time value and return the calculated result."
}
---

## Description

The DATE_ADD function is used to add a specified time interval to a specified date or time value and return the calculated result.

- Supported input date types include DATE, DATETIME, TIMESTAMPTZ (such as '2023-12-31', '2023-12-31 23:59:59', '2023-12-31 23:59:59+08:00').
- The time interval is specified by both a numeric value (`expr`) and a unit (`time_unit`). When `expr` is positive, it means "add", and when it is negative, it is equivalent to "subtract" the corresponding interval.

## Aliases

- days_add
- adddate

## Syntax

```sql
DATE_ADD(<date_or_time_expr>, <expr> <time_unit>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | The date/time value to be processed. Supported types: datetime or date type, with a maximum precision of six decimal places for seconds (e.g., 2022-12-28 23:59:59.999999). For specific formats, please refer to [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<expr>` | The time interval to be added, of `INT` type |
| `<time_unit>` | Enumeration values: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND, DAY_SECOND, DAY_HOUR, MINUTE_SECOND, SECOND_MICROSECOND | 

## Return Value

Returns a result with the same type as <date_or_time_expr>:
- When DATE type is input, returns DATE (date part only);
- When DATETIME type input, returns DATETIME (including date and time);
- WHEN TIMESTAMPTZ type input, returns TIMESTAMPTZ (including date, time, and timezone offset).
- Input with scale (such as '2024-01-01 12:00:00.123') will preserve the scale, with a maximum of six decimal places.

Special cases:
- When any parameter is NULL, returns NULL;
- When illegal unit or non-numeric expr, returns an error;
- When the calculation result exceeds the date type range (such as before '0000-00-00 23:59:59' or after '9999-12-31 23:59:59'), returns an error.
- If the next month does not have enough days for the input date, it will automatically be set to the last day of the next month.

## Examples

```sql
-- Add days
select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------+
| date_add('2010-11-30 23:59:59', INTERVAL 2 DAY) |
+-------------------------------------------------+
| 2010-12-02 23:59:59                             |
+-------------------------------------------------+

-- Add quarters
mysql> select DATE_ADD(cast('2023-01-01' as date), INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

-- Add weeks
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

-- Add months, since February 2023 only has 28 days, January 31 plus one month returns February 28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

-- Negative number test
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

-- Cross-year hour addition
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

-- Add DAY_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND);
+-------------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 1:2:3' DAY_SECOND) |
+-------------------------------------------------------------------+
| 2025-10-24 11:12:13                                               |
+-------------------------------------------------------------------+

-- Add DAY_HOUR
mysql>  select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR);
+----------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1 2' DAY_HOUR) |
+----------------------------------------------------------+
| 2025-10-24 12:10:10                                      |
+----------------------------------------------------------+

-- Add MINUTE_SECOND
mysql> select DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND);
+---------------------------------------------------------------+
| DATE_ADD('2025-10-23 10:10:10', INTERVAL '1:1' MINUTE_SECOND) |
+---------------------------------------------------------------+
| 2025-10-23 10:11:11                                           |
+---------------------------------------------------------------+

-- Add SECOND_MICROSECOND
mysql>  select date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND);
+---------------------------------------------------------------------------+
| date_add("2025-10-10 10:10:10.123456", INTERVAL "1.1" SECOND_MICROSECOND) |
+---------------------------------------------------------------------------+
| 2025-10-10 10:10:11.223456                                                |
+---------------------------------------------------------------------------+

-- Example of TimestampTz type, SET time_zone = '+08:00'
select DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY);
+-------------------------------------------------------+
| DATE_ADD('2023-01-01 23:22:33+03:00', INTERVAL 1 DAY) |
+-------------------------------------------------------+
| 2023-01-03 04:22:33+08:00                             |
+-------------------------------------------------------+

-- Illegal unit
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

-- Parameter is NULL, returns NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

-- Calculated result is not in date range [0000,9999], returns error
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```
