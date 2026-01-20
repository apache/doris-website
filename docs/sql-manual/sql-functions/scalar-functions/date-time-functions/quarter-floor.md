---
{
    "title": "QUARTER_FLOOR",
    "language": "en",
    "description": "QUARTERFLOOR function rounds down the input datetime value to the nearest specified quarter period. If you specify origin time,"
}
---

## Description

QUARTER_FLOOR function rounds down the input datetime value to the nearest specified quarter period. If you specify origin time, the period will be divided based on this time and rounded down; if not specified, the default is 0001-01-01 00:00:00. This function supports TIMESTAMPTZ, DATETIME and DATE types.

Date and time calculation formula:

$$
\begin{aligned}
&\text{quarter\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods from the base time to the target time

## Syntax

```sql
QUARTER_FLOOR(`<date_or_time_expr>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<origin>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`)
QUARTER_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<date_or_time_expr>` | The datetime value to be rounded down, supports DATETIME/DATE/TIMESTAMPTZ types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific formats please see [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion),  [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Quarter period value, type INT, indicating the number of quarters contained in each period |
| `<origin_datetime>` | Starting time point of the period, type DATETIME/DATE, default is 0001-01-01 00:00:00 |

## Return Value

Return type is DATETIME, returning the time value rounded down to the nearest specified quarter period based on the input datetime. The precision of the return value is the same as the precision of the input parameter datetime.

- If `<period>` is non-positive (≤0), an error is returned.
- If any parameter is NULL, return NULL.
- When period is not specified, the default is 1 quarter as the period.
- When `<origin>` is not specified, the default is based on 0001-01-01 00:00:00.
- If the input is DATE type (only containing year, month, day), its time part defaults to 00:00:00.
- If the `<origin>` datetime is after `<period>`, it will also be calculated according to the above formula, but the period k is negative.
- If `date_or_time_expr` has scale, the return result also has scale and the fractional part is zero.
- If the input is TIMESTAMPTZ type, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when the session variable is `+08:00`), and then perform FLOOR calculation.
- If the input time values (`<date_or_time_expr>` and `<period>`) contain both TIMESTAMPTZ and DATETIME types, the output is DATETIME type.

## Description

The quarter_floor function rounds a datetime value down to the nearest specified quarter period boundary. If origin is specified, the period is calculated based on that time.

Date calculation formula:
$$
\begin{aligned}
&\text{quarter\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{quarter} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods needed from the baseline time to reach the target time.

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
| `<date_or_time_expr>` | The datetime value to be rounded up. It is a valid date expression that supports date/datetime types. For specific datetime and date formats, see [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion.md) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | Quarter period value, type INT, indicating the number of quarters contained in each period |
| `<origin_datetime>` | The starting time point of the period, supports date/datetime types, default value is 0001-01-01 00:00:00 |

Notes:
- When period is not specified, it is equivalent to using 1 quarter as the period
- When period is not a positive integer, the function result will be NULL
- The result always rounds to the past time
- The time part of the return value is always 00:00:00

## Return Value

When `<datetime>` is of DATE type, the return type is DATE.
When `<datetime>` is of DATETIME type, the return type is DATETIME.
The time part of the result will be set to 00:00:00.

## Examples

```sql
-- Default period of 1 quarter, default start time 0001-01-01 00:00:00
SELECT QUARTER_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- With 5 quarters as one period, rounding down result with default starting point
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 5) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Input datetime is exactly the period starting point, return the input datetime
SELECT QUARTER_FLOOR('2023-07-01 00:00:00', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Only start date and specified date
select QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00");
+-------------------------------------------------------------+
| QUARTER_FLOOR("2023-07-13 22:28:18", "2023-01-01 00:00:00") |
+-------------------------------------------------------------+
| 2023-07-01 00:00:00                                         |
+-------------------------------------------------------------+

-- Specify origin time
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', 2, '2023-01-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 00:00:00 |
+---------------------+

--- Datetime with scale, all decimal places will be truncated to 0
SELECT QUARTER_FLOOR('2023-07-13 22:28:18.456789', 1) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-01 00:00:00.000000 |
+----------------------------+

--- If <origin> datetime is after <period>, it will also be calculated according to the above formula, but period k is negative
SELECT QUARTER_FLOOR('2022-09-13 22:28:18', 4, '2028-07-01 00:00:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2020-07-01 00:00:00 |
+---------------------+

--- Input is DATE type (default time 00:00:00)
SELECT QUARTER_FLOOR('2023-07-13', 1) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Example of TimeStampTz type, SET time_zone = '+08:00'
-- Convert the variable value to local_time(2026-01-01 02:59:59) before performing CEIL operation
SELECT QUARTER_CEIL('2025-12-31 23:59:59+05:00');
+-------------------------------------------+
| QUARTER_CEIL('2025-12-31 23:59:59+05:00') |
+-------------------------------------------+
| 2026-04-01 00:00:00+08:00                 |
+-------------------------------------------+

-- If the parameters include both TimeStampTz and Datetime types, output the DateTime type.
SELECT QUARTER_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+----------------------------------------------------------------------+
| QUARTER_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+----------------------------------------------------------------------+
| 2026-03-15 00:00:00.123                                              |
+----------------------------------------------------------------------+

--- Period is non-positive, returns error
SELECT QUARTER_FLOOR('2023-07-13 22:28:18', -1) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation quarter_floor of 2023-07-13 22:28:18, -1 out of range

--- Any parameter is NULL, returns NULL
SELECT QUARTER_FLOOR(NULL, 1), QUARTER_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| quarter_floor(NULL, 1) | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```

## Best Practices

See also [date_floor](./date-floor)
