---
{
    "title": "WEEK_CEIL | Date Time Functions",
    "language": "en",
    "description": "The weekceil function rounds up an input datetime value to the nearest specified week interval start time. If origin is specified,",
    "sidebar_label": "WEEK_CEIL"
}
---

# WEEK_CEIL

## Description


The week_ceil function rounds up an input datetime value to the nearest specified week interval start time. If origin is specified, it uses that as the reference; otherwise, it defaults to 0000-01-01 00:00:00.

Date calculation formula:
$$
\begin{aligned}
&\text{week\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{week} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods needed from the reference time to reach the target time.

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
| `<date_or_time_expr>` | The datetime value to round up, supports date/datetime/timestamptz types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific formats please see [timestamptz conversion](../../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion.md), and for datetime/date formats refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Week interval value, type INT, representing the number of weeks in each interval |
| `<origin>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00 |

## Return Value

Returns TIMESTAMPTZ, DATETIME or DATE type, representing the rounded-up datetime value.

- If `<period>` is a non-positive integer (≤0), the function returns an error;
- If any parameter is NULL, returns NULL;
- If `<datetime>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point;
- If input is date type, returns date type
- If input is datetime type, returns datetime type with the same time portion as the origin time.
- If calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns an error.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.
- If date_or_time_expr has a scale, the returned result will also have a scale with the fractional part being zero.
- If the input is TIMESTAMPTZ type, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when the session variable is `+08:00`), and then perform WEEK_CEIL.
- If the input time values (`<date_or_time_expr>` and `<period>`) contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.

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

--input with decimal part 
mysql> SELECT WEEK_CEIL('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-24 00:00:00.000 |
+-------------------------+

-- Only with origin date and specified date
select week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00");
+---------------------------------------------------------+
| week_ceil("2023-07-13 22:28:18", "2021-05-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-15 12:00:00                                     |
+---------------------------------------------------------+

-- Specify origin date
SELECT WEEK_CEIL('2023-07-13', 1, '2023-07-03') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-17 00:00:00 |
+---------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform WEEK_CEIL
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-05 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| WEEK_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-05 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Invalid period (non-positive integer)
SELECT WEEK_CEIL('2023-07-13', 0) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_ceil of 2023-07-13 00:00:00, 0 out of range

-- Parameter is NULL
SELECT WEEK_CEIL(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```

