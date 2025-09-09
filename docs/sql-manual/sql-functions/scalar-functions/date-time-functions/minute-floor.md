---
{
    "title": "MINUTE_FLOOR",
    "language": "en"
}
---

## Description

The MINUTE_FLOOR function rounds the input datetime value down to the nearest specified minute interval. If an origin time is specified, it uses that time as the baseline for dividing intervals and rounding; if not specified, it defaults to 0001-01-01 00:00:00 as the baseline. This function supports processing DATETIME types.

Date calculation formula:
MINUTE_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × minute | k ∈ ℤ ∧ `<origin>` + k × `<period>` × minute ≤ `<date_or_time_expr>`}
K represents the number of periods from the baseline time to the target time.

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

- If `<period>` is a non-positive integer (≤0), returns NULL.
- If any parameter is NULL, returns NULL.
- If period is not specified, it defaults to a 1-minute interval.
- If `<origin>` is not specified, it defaults to 0001-01-01 00:00:00 as the baseline.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.

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

-- Period is non-positive, returns NULL
SELECT MINUTE_FLOOR('2023-07-13 22:28:18', -5) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MINUTE_FLOOR(NULL, 5), MINUTE_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+------------------------+--------+
| minute_floor(NULL, 5)  | result |
+------------------------+--------+
| NULL                   | NULL   |
+------------------------+--------+
```
