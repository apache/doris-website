---
{
    "title": "MONTH_FLOOR",
    "language": "en",
    "description": "The monthfloor function rounds the input datetime value down to the nearest specified month interval. If origin is specified,"
}
---

## Description

The month_floor function rounds the input datetime value down to the nearest specified month interval. If origin is specified, it uses that as the baseline; otherwise, it defaults to 0001-01-01 00:00:00.

Date calculation formula:
$$
\begin{aligned}
&\text{month\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{month} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods from the baseline time to the target time.

## Syntax

```sql
MONTH_FLOOR(`<datetime>`)
MONTH_FLOOR(`<datetime>`, `<origin>`)
MONTH_FLOOR(`<datetime>`, `<period>`)
MONTH_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | The datetime value to be rounded down, supports DATETIME/DATE/TIMESTAMPTZ types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific formats please see [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), and for datetime/date formats refer to [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | The month interval value, of type INT, representing the number of months contained in each interval. |
| `<origin>` | The starting time point of the interval, of type DATETIME and DATE. Default value is 0001-01-01 00:00:00. |

## Return Value

Returns TIMESTAMPTZ, DATETIME or DATE, representing the time value after rounding down to the nearest specified month interval based on the input datetime. The time component of the result will be set to 00:00:00, and the day component will be truncated to 01.

- If `<period>` is a non-positive number (≤0), returns error.
- If any parameter is NULL, returns NULL.
- If period is not specified, it defaults to a 1-month interval.
- If `<origin>` is not specified, it defaults to 0001-01-01 00:00:00 as the baseline.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.
- If date_or_time_expr has a scale, the returned result will also have a scale with the fractional part being zero.
- If the input is TIMESTAMPTZ type, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when the session variable is `+08:00`), and then perform MONTH_FLOOR.
- If the input time values (`<datetime>` and `<period>`) contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.

## Examples

```sql
-- Using default period of 1 month and default origin time 0001-01-01 00:00:00
SELECT MONTH_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Using 5 months as one period, rounding down with default origin point
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MONTH_FLOOR('2023-06-01 00:00:00', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Only with origin date and specified date
 select month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00");
+-----------------------------------------------------------+
| month_floor("2023-07-13 22:28:18", "2023-01-04 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-04 00:00:00                                       |
+-----------------------------------------------------------+

-- Specifying origin time
SELECT MONTH_FLOOR('2023-07-13 22:28:18', 5, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Datetime with scale, time component and decimal places are all truncated to 0
SELECT MONTH_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-06-01 00:00:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing the FLOOR operation
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00');
+------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00') |
+------------------------------------------+
| 2026-01-01 00:00:00+08:00                |
+------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+---------------------------------------------------------------------+
| MONTH_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+---------------------------------------------------------------------+
| 2025-12-15 00:00:00.123                                             |
+---------------------------------------------------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
SELECT MONTH_FLOOR('2022-09-13 22:28:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2022-09-03 22:20:00 |
+---------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
