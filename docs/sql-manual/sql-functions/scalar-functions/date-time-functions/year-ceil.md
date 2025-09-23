---
{
  "title": "YEAR_CEIL",
  "language": "en"
}
---

## Description

The YEAR_CEIL function rounds up an input datetime value to the nearest specified year interval start time, with the interval unit being year. If a starting reference point (origin) is specified, it uses that point as the basis for calculating intervals; otherwise, it defaults to using 0000-01-01 00:00:00 as the reference point.

Date calculation formula:
$$
\text{YEAR\_CEIL}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{year} \geq \langle\text{date\_or\_time\_expr}\rangle\}
$$
where K represents the number of periods needed to reach the target time from the reference time.

## Syntax
```sql
DATETIME YEAR_CEIL(DATETIME `<date_or_time_expr>`)
DATETIME YEAR_CEIL(DATETIME `<date_or_time_expr>`, DATETIME origin)
DATETIME YEAR_CEIL(DATETIME `<date_or_time_expr>`, INT period)
DATETIME YEAR_CEIL(DATETIME `<date_or_time_expr>`, INT period, DATETIME origin)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to round up, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Optional, represents how many seconds each period consists of, supports positive integer type (INT). Default is 1 second. |
| `<origin_datetime>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00. |

## Return Value

Returns a result consistent with the input type (DATETIME or DATE), representing the year interval start time after rounding up:

- If input is DATE type, returns DATE type (containing only date part); if input is DATETIME or properly formatted string, returns DATETIME type (time part consistent with origin, defaults to 00:00:00 when no origin).
- If `<period>` is a non-positive integer (≤0), the function returns an error.
- If any parameter is NULL, returns NULL.
- If `<date_or_time_expr>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point.
- If calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns an error.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql
-- Default 1-year interval (start point is January 1st each year), 2023-07-13 rounds up to 2024-01-01
SELECT YEAR_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- Specify 5-year interval, 2023-07-13 rounds up to nearest 5-year interval start (calculated with default origin)
SELECT YEAR_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-01 00:00:00 |  
+---------------------+

-- Input is DATE type, returns DATE type interval start
SELECT YEAR_CEIL(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2024-01-01 |
+------------+

-- Specify origin reference point='2020-01-01', 1-year interval, 2023-07-13 rounds to 2024-01-01
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

-- Specify origin with time part, returned result's time part matches origin
SELECT YEAR_CEIL('2023-07-13', 1, '2020-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- Input exactly at interval start point (origin='2023-01-01', period=1), returns itself
SELECT YEAR_CEIL('2023-01-01', 1, '2023-01-01') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT YEAR_CEIL('2023-07-13 22:22:56', 1, '2028-01-01 08:30:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 08:30:00 |
+---------------------+

-- Invalid period (non-positive integer)
SELECT YEAR_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation year_ceil of 2023-07-13 00:00:00, 0 out of range

-- Any parameter is NULL, returns NULL
SELECT YEAR_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Calculation result exceeds maximum datetime, returns error
SELECT YEAR_CEIL('9999-12-31 22:28:18', 5) AS result;
-- ERROR: Operation out of range
```
