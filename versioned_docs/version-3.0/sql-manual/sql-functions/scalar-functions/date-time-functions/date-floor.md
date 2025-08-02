---
{
    "title": "DATE_FLOOR",
    "language": "en"
}
---

## Description

The DATE_FLOOR function is used to floor a specified date or time value down to the nearest start of a specified time interval period. That is, it returns the largest periodic moment that is not greater than the input date and time. The period rules are jointly defined by <period> (number of periods) and <type> (period unit), and all periods are calculated based on the fixed starting point 0001-01-01 00:00:00.

## Syntax

`DATE_FLOOR(<datetime>, INTERVAL <period> <type>)`

## Parameter

| parameter | description |
| -- | -- |
| `datetime` | A valid date expression, of type DATE or DATETIME |
| `period` | Specifies the number of units each period consists of, of type INT. The starting time point is 0001-01-01T00:00:00 |
| `type` | Can be: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, WEEK |

## Return value

Returns the result of flooring the date down according to the period, with the same type as <datetime>.

If the input is valid, the floored result is of the same type as <datetime>:

- When input is DATE, returns DATE (only the date part, time defaults to 00:00:00);
- When input is DATETIME or a string with time, returns DATETIME (including date and time).

Special cases:

- Returns NULL if any parameter is NULL;
- Returns NULL for invalid dates, illegal <period> (non-positive integers) or <type>;
- Returns NULL if the floored result is earlier than the minimum value supported by the date type (e.g., before '0001-01-01').

## Example

```sql
-- Floor down to the nearest 5-second interval (period starts at 00, 05, 10... seconds)
mysql> select date_floor("0001-01-01 00:00:18", INTERVAL 5 SECOND);
+------------------------------------------------------+
| date_floor("0001-01-01 00:00:18", INTERVAL 5 SECOND) |
+------------------------------------------------------+
| 0001-01-01 00:00:15                                  |
+------------------------------------------------------+

-- The input time is exactly the start of a 5-day period
mysql> select date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY);
+---------------------------------------------------+
| date_floor("2023-07-10 00:00:00", INTERVAL 5 DAY) |
+---------------------------------------------------+
| 2023-07-10 00:00:00                               |
+---------------------------------------------------+

--- Floor down for date type
mysql> select date_floor("2023-07-13", INTERVAL 5 YEAR);
+-------------------------------------------+
| date_floor("2023-07-13", INTERVAL 5 YEAR) |
+-------------------------------------------+
| 2021-01-01 00:00:00                       |
+-------------------------------------------+

--- period is negative, invalid returns NULL
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE);
+-------------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL -5 MINUTE) |
+-------------------------------------------------------+
| NULL                                                  |
+-------------------------------------------------------+

--- datetime is invalid, returns NULL
mysql> select date_floor("2023-02-30 22:28:18", INTERVAL 5 DAY); 
+---------------------------------------------------+
| date_floor("2023-02-30 22:28:18", INTERVAL 5 DAY) |
+---------------------------------------------------+
| NULL                                              |
+---------------------------------------------------+

--- Unsupported type
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 MILLISECOND);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'MILLISECOND' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 52)

--- Any parameter is NULL
mysql> select date_floor(NULL, INTERVAL 5 HOUR);
+-----------------------------------+
| date_floor(NULL, INTERVAL 5 HOUR) |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

--- Floor down every 5 weeks
mysql> select date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK);
+----------------------------------------------------+
| date_floor("2023-07-13 22:28:18", INTERVAL 5 WEEK) |
+----------------------------------------------------+
| 2023-07-10 00:00:00                                |
+----------------------------------------------------+

--- Exceeds the minimum date range, returns NULL
mysql> select date_floor("0000-01-01", INTERVAL 5 WEEK);
+-------------------------------------------+
| date_floor("0000-01-01", INTERVAL 5 WEEK) |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```