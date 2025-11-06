---
{
    "title": "QUARTER_CEIL",
    "language": "en"
}
---

## Description

The QUARTER_CEIL function rounds up the input datetime value to the nearest specified quarter period. If an origin time is specified, it uses that time as the baseline for period calculation; if not specified, it defaults to 0001-01-01 00:00:00. This function supports processing DATETIME and DATE types.

Date calculation formula:
$$
\begin{aligned}
&\text{quarter\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods needed from the baseline time to reach the target time

## Syntax

```sql
QUARTER_CEIL(`<date_or_time_expr>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<origin>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`)
QUARTER_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr>` | The datetime value to be rounded up. It is a valid date expression that supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Quarter period value, type INT, indicating the number of quarters contained in each period |
| `<origin_datetime>` | The starting time point of the period, supports date/datetime types, default value is 0001-01-01 00:00:00 |

## Return Value

Returns DATETIME type, returning the time value rounded up to the nearest specified quarter period based on the input datetime. The precision of the return value matches the precision of the input datetime parameter.

- If `<period>` is non-positive, returns an error.
- If any parameter is NULL, returns NULL.
- When period is not specified, defaults to 1 quarter period.
- When `<origin>` is not specified, defaults to 0001-01-01 00:00:00 as baseline.
- When input is DATE type (default time is set to 00:00:00).
- If the calculation result exceeds the maximum date range 9999-12-31 23:59:59, returns an error
- If `<origin>` datetime is after `<period>`, the calculation follows the same formula, but period k is negative.
- If `date_or_time_expr` has scale, the returned result also has scale with fractional part as zero.

## Examples

```sql
-- Default period of 1 quarter, default origin time 0001-01-01 00:00:00
SELECT QUARTER_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- Period of 5 quarters, rounding up result with default origin point
SELECT QUARTER_CEIL('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2024-10-01 00:00:00 |
+---------------------+

-- With only origin date and specified date
select QUARTER_CEIL("2023-07-13 22:28:18", "2022-07-01 00:00:00");
+-------------------------------------------------------------+
| QUARTER_CEIL("2023-07-13 22:28:18", "2022-07-01 00:00:00") |
+-------------------------------------------------------------+
| 2023-10-01 00:00:00                                         |
+-------------------------------------------------------------+

-- Input datetime exactly at period start point, returns the input datetime
SELECT QUARTER_CEIL('2023-10-01 00:00:00', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-01 00:00:00        |
+----------------------------+

-- Specified origin time
SELECT QUARTER_CEIL('2023-07-13 22:28:18', 2, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-01-01 00:00:00 |
+---------------------+

--- Datetime with scale, time part and fractional digits are truncated to 0
SELECT QUARTER_CEIL('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-10-01 00:00:00.000000 |
+----------------------------+

--- If <origin> datetime is after <period>, calculation follows the same formula with negative period k
SELECT QUARTER_CEIL('2022-09-13 22:28:18', 4, '2028-07-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2024-07-01 00:00:00 |
+---------------------+

--- Input as DATE type (default time 00:00:00)
SELECT QUARTER_CEIL('2023-07-13', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-01 00:00:00 |
+---------------------+

-- Calculation result exceeds maximum date range 9999-12-31, returns error
SELECT QUARTER_CEIL('9999-10-13 22:28:18', 2) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_ceil of 9999-10-13 22:28:18, 2 out of range

--- Non-positive period, returns error
SELECT QUARTER_CEIL('2023-07-13 22:28:18', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_ceil of 2023-07-13 22:28:18, -1 out of range

--- Any parameter is NULL, returns NULL
SELECT QUARTER_CEIL(NULL, 1), QUARTER_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| quarter_ceil(NULL, 1) | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```

## Best Practices

See also [date_ceil](./date-ceil)
