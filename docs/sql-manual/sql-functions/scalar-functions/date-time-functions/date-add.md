---
{
    "title": "DATE_ADD",
    "language": "en"
}
---

## Description

The DATE_ADD function is used to add a specified time interval to a given date or time value and return the calculated result.

- Supported input date types include DATE, DATETIME, or formatted strings (such as '2023-12-31', '2023-12-31 23:59:59').
- The time interval is specified by a numerical value (`expr`) and a unit (`time_unit`). When `expr` is a positive number, it means "adding"; when it is a negative number, it is equivalent to "subtracting" the corresponding interval.

## Aliases

- date_add
- days_add
- adddate

## Syntax

```sql
DATE_ADD(<date>, <expr> <time_unit>)
```

## Parameter

| parameter | description |
| -- | -- |
| `<date>` | The date/time value to be processed. Supported types: `datetime` or `date` type and `string` types that conform to the format,for specific datetime formats, please refer to [cast to datetime](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [cast to date](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion))|
| `<expr>` | 	The time interval to be added, of type INT|
| `<time_unit>` | Enumerated values: YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND, WEEK |

## Return value

The returned result is of the same type as `date`:

- When input is DATE, returns DATE (date part only);
- When input is DATETIME/TIMESTAMP or a string with time, returns DATETIME (including date and time);
- Inputs with fractional seconds (such as '2024-01-01 12:00:00.123') retain the fractional precision.

Special cases:

- Returns NULL if any parameter is NULL;
- Returns NULL illegal units, or non-numerical `expr`;
- Returns NULL if the calculated result is outside the range of the date type (e.g., before '0000-00-00').
- If the next month has fewer days than the input date, it will be automatically set to the last day of the next month.

## Examples

```sql
---Add days
mysql> select date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY);

+-------------------------------------------------------------------+
| date_add(cast('2010-11-30 23:59:59' as datetime), INTERVAL 2 DAY) |
+-------------------------------------------------------------------+
| 2010-12-02 23:59:59                                               |
+-------------------------------------------------------------------+

---Add quarters
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 QUARTER);
+--------------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 QUARTER) |
+--------------------------------------------+
| 2023-04-01                                 |
+--------------------------------------------+

---Add weeks
mysql> select DATE_ADD('2023-01-01', INTERVAL 1 WEEK);
+-----------------------------------------+
| DATE_ADD('2023-01-01', INTERVAL 1 WEEK) |
+-----------------------------------------+
| 2023-01-08                              |
+-----------------------------------------+

---Add months. Since February 2023 has only 28 days, adding one month to January 31 returns February 28
mysql> select DATE_ADD('2023-01-31', INTERVAL 1 MONTH);
+------------------------------------------+
| DATE_ADD('2023-01-31', INTERVAL 1 MONTH) |
+------------------------------------------+
| 2023-02-28                               |
+------------------------------------------+

---Negative number test
mysql> select DATE_ADD('2019-01-01', INTERVAL -3 DAY);
+-----------------------------------------+
| DATE_ADD('2019-01-01', INTERVAL -3 DAY) |
+-----------------------------------------+
| 2018-12-29                              |
+-----------------------------------------+

---illegal unit
select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 sa);
ERROR 1105 (HY000): errCode = 2, detailMessage = 
mismatched input 'sa' expecting {'.', '[', 'AND', 'BETWEEN', 'COLLATE', 'DAY', 'DIV', 'HOUR', 'IN', 'IS', 'LIKE', 'MATCH', 'MATCH_ALL', 'MATCH_ANY', 'MATCH_PHRASE', 'MATCH_PHRASE_EDGE', 'MATCH_PHRASE_PREFIX', 'MATCH_REGEXP', 'MINUTE', 'MONTH', 'NOT', 'OR', 'QUARTER', 'REGEXP', 'RLIKE', 'SECOND', 'WEEK', 'XOR', 'YEAR', EQ, '<=>', NEQ, '<', LTE, '>', GTE, '+', '-', '*', '/', '%', '&', '&&', '|', '||', '^'}(line 1, pos 50)

---Add hours across years
mysql> select DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR);
+--------------------------------------------------+
| DATE_ADD('2023-12-31 23:00:00', INTERVAL 2 HOUR) |
+--------------------------------------------------+
| 2024-01-01 01:00:00                              |
+--------------------------------------------------+

---Parameter is NULL, returns NULL
mysql> select DATE_ADD(NULL, INTERVAL 1 MONTH);
+----------------------------------+
| DATE_ADD(NULL, INTERVAL 1 MONTH) |
+----------------------------------+
| NULL                             |
+----------------------------------+

------date is not in the range of[0000-01-01,9999-12-31],return null
mysql> select DATE_ADD('0001-01-28', INTERVAL -2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 0001-01-28, -2 out of range

mysql> select DATE_ADD('9999-01-28', INTERVAL 2 YEAR);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.2)[E-218]Operation years_add of 9999-01-28, 2 out of range
```