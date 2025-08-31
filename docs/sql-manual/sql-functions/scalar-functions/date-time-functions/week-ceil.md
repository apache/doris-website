---
{
    "title": "WEEK_CEIL",
    "language": "en"
}
---

## Description

The WEEK_CEIL function rounds up an input datetime value to the nearest specified week interval start time, with the interval unit being WEEK. If a starting reference point (origin) is specified, it uses that point as the basis for calculating intervals; otherwise, it defaults to using 0000-01-01 00:00:00 as the reference point.

Date calculation formula:
WEEK_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`) = min{`<origin>` + k × `<period>` × week | k ∈ ℤ ∧ `<origin>` + k × `<period>` × week ≥ `<date_or_time_expr>`}
where K represents the number of periods needed to reach the target time from the reference time.

## Syntax

```sql
WEEK_CEIL(`<date_or_time_expr>`)
WEEK_CEIL(`<date_or_time_expr>`, `<origin>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`)
WEEK_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to round up, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Week interval value, type INT, representing the number of weeks in each interval |
| `<origin>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00 |

## Return Value

Returns DATETIME type, representing the rounded-up datetime value.

- If `<period>` is a non-positive integer (≤0), the function returns an error;
- If any parameter is NULL, returns NULL;
- If `<datetime>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point;
- If input is date type, returns date type
- If input is datetime type, returns datetime type with the same time portion as the origin time.
- If calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns an error.

## Examples

```sql
-- 2023-07-13 is Thursday, rounds up to next interval start (1-week interval starts on Monday, so rounds to 2023-07-17 (Monday))
SELECT WEEK_CEIL(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- Specify 2-week interval
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-24 00:00:00 |
+---------------------+

-- Input date type returns date type, date string returns datetime
SELECT WEEK_CEIL(cast('2023-07-13' as date));
+---------------------------------------+
| WEEK_CEIL(cast('2023-07-13' as date)) |
+---------------------------------------+
| 2023-07-17                            |
+---------------------------------------+

-- Specify origin date
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- Invalid period (non-positive integer)
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
-- ERROR: period cannot be negative or zero

-- Parameter is NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
