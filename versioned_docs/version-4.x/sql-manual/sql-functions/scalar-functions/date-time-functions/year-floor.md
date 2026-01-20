---
{
    "title": "YEAR_FLOOR",
    "language": "en",
    "description": "The yearfloor function rounds down an input datetime value to the nearest specified year interval start time. If origin is specified,"
}
---

## Description

The year_floor function rounds down an input datetime value to the nearest specified year interval start time. If origin is specified, it uses that as the reference; otherwise, it defaults to 0000-01-01 00:00:00.

Date calculation formula:
$$
\begin{aligned}
&\text{year\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods from the reference time to the target time.

## Syntax
```sql
YEAR_FLOOR(<date_or_time_expr>)
YEAR_FLOOR(<date_or_time_expr>, origin)
YEAR_FLOOR(<date_or_time_expr>, <period>)
YEAR_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to round down, supports date/datetime/timestamptz types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific formats please see [timestamptz conversion](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion.md), and for datetime/date formats refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Optional, represents how many seconds each period consists of, supports positive integer type (INT). Default is 1 second. |
| `<origin_datetime>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00. |

## Return Value
Returns a result consistent with the input type (TIMESTAMPTZ, DATETIME or DATE), representing the year interval start time after rounding down:

- If input is DATE type, returns DATE type (containing only date part); if input is DATETIME or properly formatted string, returns DATETIME type (time part consistent with origin, defaults to 00:00:00 when no origin).
- If `<period>` is a non-positive integer (≤0), the function returns an error.
- If any parameter is NULL, returns NULL.
- If `<date_or_time_expr>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point.
- If calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns an error.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.
- If date_or_time_expr has a scale, the returned result will also have a scale with the fractional part being zero.
- If the input is TIMESTAMPTZ type, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when the session variable is `+08:00`), and then perform YEAR_FLOOR.
- If the input time values (`<date_or_time_expr>` and `<period>`) contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.

## Examples
```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds down to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds down to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2020-01-01 00:00:00 |  
+---------------------+

-- input with scale
mysql> SELECT YEAR_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2021-01-01 00:00:00.000 |
+-------------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-01-01 |
+------------+

-- Only with origin date and specified date
select year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00");
+----------------------------------------------------------+
| year_floor("2023-07-13 22:28:18", "2021-03-13 22:13:00") |
+----------------------------------------------------------+
| 2023-03-13 22:13:00                                      |
+----------------------------------------------------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2023-01-01
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_FLOOR('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_FLOOR('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- Input time earlier than origin start time, rounds down to earlier interval point
SELECT YEAR_FLOOR('2019-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2019-01-01 00:00:00 |
+---------------------+

-- Cross-multiple periods rounding down, period=3, origin='2020-01-01'
SELECT YEAR_FLOOR('2025-07-13', 3, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

-- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_FLOOR('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- Input time part earlier than origin time part, rounds down within same year
SELECT YEAR_FLOOR('2023-07-13 06:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-01-01 08:30:00 |
+---------------------+

-- Input time part later than origin time part, normal rounding down
SELECT YEAR_FLOOR('2023-07-13 10:00:00', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 08:30:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform YEAR_FLOOR
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00')|
+----------------------------------------+
| 2026-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+--------------------------------------------------------------------+
| YEAR_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+--------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                            |
+--------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_FLOOR('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_floor of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
