---
{
    "title": "DATE_CEIL",
    "language": "en"
}
---

## Description

The DATE_CEIL function is used to round up (ceil) a specified date or time value to the nearest start of a specified time interval period. That is, it returns the smallest periodic moment that is not less than the input date and time. The period rules are jointly defined by `period` (number of periods) and `type` (period unit), and all periods are calculated based on the fixed starting point 0001-01-01 00:00:00.

## Syntax

`DATE_CEIL(<datetime>, INTERVAL <period> <type>)`

## Parameter

| parameter | description |
| -- | -- |
| `datetime` | A valid date expression, supporting input of `datetime` or `date` type and `string` types that conform to the format|
| `period` | 	Specifies the number of units each period consists of, of type INT. The starting time point is 0001-01-01T00:00:00 |
| `type` | Can be: YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, WEEK |

## Raturn value

Returns a date or time value representing the result of rounding up the input value to the specified unit.

If the input is valid, the rounded result is of the same type as `datetime`:

- When input is DATE, returns DATE (only the date part, time defaults to 00:00:00);
- When input is DATETIME, returns DATETIME (including date and time).
- Return value with scale if datetime has scale.

Special cases:

- Returns NULL if any parameter is NULL;
- Returns NULL if the rounded result exceeds the range supported by the date type (e.g., after '9999-12-31');
- Returns NULL if the `period` parameter is negative;
- If the input parameters are invalid (such as an incorrectly formatted date(e.g., 2022-2-32 13:21:03; for specific datetime formats, please refer to [cast to datetime](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion/) and [cast to date](https://doris.apache.org/docs/dev/sql-manual/basic-element/sql-data-types/conversion/date-conversion/)), an illegal time unit, etc.), the function returns NULL.

## Examples

```sql

---Round up seconds to the nearest 5-second interval
mysql> select date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second);

+----------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18" as datetime),interval 5 second) |
+----------------------------------------------------------------------+
| 2023-07-13 22:28:20.000000                                           |
+----------------------------------------------------------------------+

---input datetime with scale

mysql> select date_ceil(cast("2023-07-13 22:28:18.123" as datetime),interval 5 second);
+----------------------------------------------------------------------------+
| date_ceil(cast("2023-07-13 22:28:18.123" as datetime),interval 5 second) |
+----------------------------------------------------------------------------+
| 2023-07-13 22:28:20.000000                                                 |
+----------------------------------------------------------------------------+

---Round up to the nearest 5-minute interval
select date_ceil("2023-07-13 22:28:18",interval 5 minute);
+--------------------------------------------------------------+
| minute_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+

---Round up to the nearest 5-hour interval
select date_ceil("2023-07-13 22:28:18",interval 5 hour);

+------------------------------------------------------------+
| hour_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+------------------------------------------------------------+
| 2023-07-13 23:00:00                                        |
+------------------------------------------------------------+

---Round up to the nearest 5-day interval
select date_ceil("2023-07-13 22:28:18",interval 5 day);

+-----------------------------------------------------------+
| day_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-----------------------------------------------------------+
| 2023-07-15 00:00:00                                       |
+-----------------------------------------------------------+

---Round up to the nearest 5-month interval
select date_ceil("2023-07-13 22:28:18",interval 5 month);

+-------------------------------------------------------------+
| month_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+-------------------------------------------------------------+
| 2023-12-01 00:00:00                                         |
+-------------------------------------------------------------+

---Round up to the nearest 5-year interval
select date_ceil("2023-07-13 22:28:18",interval 5 year);

+------------------------------------------------------------+
| year_ceil('2023-07-13 22:28:18', 5, '0001-01-01 00:00:00') |
+------------------------------------------------------------+
| 2026-01-01 00:00:00                                        |
+------------------------------------------------------------+

---Input is of date type
mysql> select date_ceil("2023-07-13",interval 5 year);
+-----------------------------------------+
| date_ceil("2023-07-13",interval 5 year) |
+-----------------------------------------+
| 2026-01-01 00:00:00                     |
+-----------------------------------------+

---Exceeds the maximum year
mysql> select date_ceil("9999-07-13",interval 5 year);
+-----------------------------------------+
| date_ceil("9999-07-13",interval 5 year) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+

--Any parameter is NULL
mysql> select date_ceil("9900-07-13",interval NULL year);
+--------------------------------------------+
| date_ceil("9900-07-13",interval NULL year) |
+--------------------------------------------+
| NULL                                       |
+--------------------------------------------+

mysql> select date_ceil(NULL,interval 5 year);
+---------------------------------+
| date_ceil(NULL,interval 5 year) |
+---------------------------------+
| NULL                            |
+---------------------------------+

---Invalid parameter, period is negative
mysql> select date_ceil("2023-01-13 22:28:18",interval -5 month);
+----------------------------------------------------+
| date_ceil("2023-01-13 22:28:18",interval -5 month) |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+

--Invalid datetime, returns NULL
mysql> select date_ceil("2023-01- 22:28:18",interval -5 month);
+--------------------------------------------------+
| date_ceil("2023-01- 22:28:18",interval -5 month) |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+


---date is not in the range of[0000,9999],return null
mysql> select date_ceil("20123-01-01 22:28:18",interval 5 month);
+--------------------------------------------------+
| date_ceil("20123-01-01 22:28:18",interval 5 month) |
+--------------------------------------------------+
| NULL                                             |
+--------------------------------------------------+
```
