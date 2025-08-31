---
{
    "title": "WEEK_FLOOR",
    "language": "en"
}
---

## Description

The WEEK_FLOOR function rounds down an input datetime value to the nearest specified week interval start time, with the interval unit being WEEK. If a starting reference point (origin) is specified, it uses that point as the basis for calculating intervals; otherwise, it defaults to using 0000-01-01 00:00:00 as the reference point.

Date calculation formula:
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × week | k ∈ ℤ ∧ `<origin>` + k × `<period>` × week ≤ `<date_or_time_expr>`}
where K represents the number of periods from the reference time to the target time.

## Syntax

```sql
WEEK_FLOOR(`<date_or_time_expr>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<origin>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`)
WEEK_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
|-----------|-------------|
| `<date_or_time_expr>` | The datetime value to round down, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Week interval value, type INT, representing the number of weeks in each interval |
| `<origin>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00 |

## Return Value

Returns DATETIME type, representing the rounded-down datetime value. The time portion of the result will be set to 00:00:00.

- If `<period>` is a non-positive integer (≤0), the function returns NULL;
- If any parameter is NULL, returns NULL;
- If `<datetime>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point;
- If input is date type, returns date type
- If input is datetime type, returns datetime type with the same time portion as the origin time.

## Examples

```sql
-- 2023-07-13 is Thursday, default 1-week interval (starting Monday), rounds down to nearest Monday (2023-07-10)
SELECT WEEK_FLOOR(cast('2023-07-13 22:28:18' as datetime)) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Specify 2-week interval, rounds down to nearest 2-week interval start
SELECT WEEK_FLOOR('2023-07-13 22:28:18', 2) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Input date type, returns date type
SELECT WEEK_FLOOR(cast('2023-07-13' as date)) AS result;
+------------+
| result     |
+------------+
| 2023-07-10 |
+------------+

-- Specify origin='2023-07-03' (Monday), 1-week interval
SELECT WEEK_FLOOR('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-10 00:00:00 |
+---------------------+

-- Invalid period (non-positive integer)
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
