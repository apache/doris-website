---
{
    "title": "DATE_FLOOR",
    "language": "en"
}
---

## Description

The DATE_FLOOR function is used to floor a specified date or time value down to the nearest start of a specified time interval period. That is, it returns the largest periodic moment that is not greater than the input date and time. The period rules are jointly defined by `period` (number of periods) and `type` (period unit), and all periods are calculated based on the fixed starting point 0001-01-01 00:00:00.

Translation of Date and Time Calculation Formula
DATE_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × day | k ∈ ℤ ∧ `<origin>` + k × `<period>` × day ≤ `<date_or_time_expr>`}

Where K represents the number of periods from the reference time to the target time.

## Syntax

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## Parameters

| Parameter | Description |
| -- | -- |
| `date_or_time_expr` | A valid date expression, support datetime or date type. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `period` | Specifies the number of units each period consists of, of `INT` type. The starting time point is 0001-01-01T00:00:00 |
| `type` | Can be: YEAR, MONTH, WEEK, DAY, HOUR, MINUTE, SECOND |

## Return Value

Returns the result of flooring the date down according to the period, with the same type as datetime.
The floored result is of the same type as datetime:
- When input is DATE, returns DATE (only the date part, time defaults to 00:00:00);
- When input is DATETIME, returns DATETIME (including date and time).
- Input with scale will return value with scale.

Special cases:
- Returns NULL if any parameter is NULL;
- Returns an error for illegal period (non-positive integers) or type;

## Examples

```sql
-- Floor down to the nearest 5-second interval (period starts at 00, 05, 10... seconds)
mysql> select date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND);
+------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18" as datetime), INTERVAL 5 SECOND) |
+------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                             |
+------------------------------------------------------------------------+

-- Date time with scale will return value with scale
mysql> select date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND);
+----------------------------------------------------------------------------+
| date_floor(cast("0001-01-01 00:00:18.123" as datetime), INTERVAL 5 SECOND) |
+----------------------------------------------------------------------------+
| 0001-01-01 00:00:15.000000                                                 |
+----------------------------------------------------------------------------+

-- The input time is exactly the start of a 5-day period
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

-- Floor down for date type
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

-- period is negative, invalid returns error
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation minute_floor of 2023-07-13 22:28:18, -5 input wrong parameters, period can not be negative or zero

-- Unsupported type
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

-- Any parameter is NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

-- Floor down every 5 weeks
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

```