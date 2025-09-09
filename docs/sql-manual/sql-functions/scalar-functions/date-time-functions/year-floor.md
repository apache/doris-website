---
{
    "title": "YEAR_FLOOR",
    "language": "en"
}
---

## Description
The YEAR_FLOOR function rounds down an input datetime value to the nearest specified year interval start time, with the interval unit being year. If a starting reference point (origin) is specified, it uses that point as the basis for calculating intervals; otherwise, it defaults to using 0000-01-01 00:00:00 as the reference point.

Date calculation formula:
YEAR_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × year | k ∈ ℤ ∧ `<origin>` + k × `<period>` × year ≤ `<date_or_time_expr>`}
where K represents the number of periods from the reference time to the target time.

## Syntax
```sql
DATETIME YEAR_FLOOR(DATETIME `<date_or_time_expr>`)
DATETIME YEAR_FLOOR(DATETIME `<date_or_time_expr>`, DATETIME origin)
DATETIME YEAR_FLOOR(DATETIME `<date_or_time_expr>`, INT period)
DATETIME YEAR_FLOOR(DATETIME `<date_or_time_expr>`, INT period, DATETIME origin)
```

## Parameters
| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to round down, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Optional, represents how many seconds each period consists of, supports positive integer type (INT). Default is 1 second. |
| `<origin_datetime>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00. |

## Return Value
Returns a result consistent with the input type (DATETIME or DATE), representing the year interval start time after rounding down:

- If input is DATE type, returns DATE type (containing only date part); if input is DATETIME or properly formatted string, returns DATETIME type (time part consistent with origin, defaults to 00:00:00 when no origin).
- If `<period>` is a non-positive integer (≤0), the function returns an error.
- If any parameter is NULL, returns NULL.
- If `<date_or_time_expr>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point.
- If calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns an error.

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

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-01-01 |
+------------+

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

-- Invalid period (non-positive integer)
SELECT YEAR_FLOOR('2023-07-13', 0) AS result;
-- ERROR: period cannot be negative or zero

-- Any parameter is NULL, returns NULL
SELECT YEAR_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
