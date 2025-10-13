---
{
    "title": "MINUTE_FLOOR",
    "language": "en"
}
---

## Description

The minute_floor function rounds the input datetime value down to the nearest specified minute interval. If origin is specified, it uses that as the baseline; otherwise, it defaults to 0001-01-01 00:00:00.

Date calculation formula:
$$
\begin{aligned}
&\text{minute\_floor}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{minute} \leq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods from the baseline time to the target time.

## Syntax

```sql
MINUTE_FLOOR(`<datetime>`)
MINUTE_FLOOR(`<datetime>`, `<origin>`)
MINUTE_FLOOR(`<datetime>`, `<period>`)
MINUTE_FLOOR(`<datetime>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<datetime>` | The datetime value to be rounded down, of type DATETIME. For specific datetime formats, [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) |
| `<period>` | The minute interval value, of type INT, representing the number of minutes contained in each interval. |
| `<origin>` | The starting time point of the interval, of type DATETIME. Default value is 0001-01-01 00:00:00. |

## Return Value

Returns a value of type DATETIME, representing the time value after rounding down to the nearest specified minute interval based on the input datetime. The precision of the return value is the same as that of the input parameter datetime.

- If `<period>` is a non-positive number (≤0), returns error.
- If any parameter is NULL, returns NULL.
- If period is not specified, it defaults to a 1-minute interval.
- If `<origin>` is not specified, it defaults to 0001-01-01 00:00:00 as the baseline.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.
- If `date_or_time_expr` has a scale, the returned result will also have a scale with the fractional part being zero.

## Examples

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_FLOOR('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:28:00 |
+---------------------+

-- Using five minutes as one period, rounding down with default origin point
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000    |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_FLOOR('2023-07-13 22:25:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Only with origin date and specified date
select minute_floor("2023-07-13 22:28:18", "2023-07-01 00:00:00");
+------------------------------------------------------------+
| minute_floor("2023-07-13 22:28:18", "2023-07-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-13 22:28:00                                        |
+------------------------------------------------------------+

-- Specifying origin time
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:25:00 |
+---------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_FLOOR('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:25:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_FLOOR('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative
SELECT MINUTE_floor('0001-01-01 12:32:18', 5, '2028-07-03 22:20:00') AS result;
+---------------------+
| result              |
+---------------------+
| 0001-01-01 12:30:00 |
+---------------------+

-- Period is non-positive, returns error
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_floor of 2023-07-13 22:28:18, -5 out of range

-- Any parameter is NULL, returns NULL
SELECT MINUTE_FLOOR(NULL, 5), MINUTE_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| minute_floor(NULL, 5)  | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
