---
{
  "title": "MINUTE_CEIL",
  "language": "en"
}
---

## Description

The MINUTE_CEIL function rounds the input datetime value up to the nearest specified minute interval. If an origin time is specified, it uses that time as the baseline for dividing intervals and rounding; if not specified, it defaults to 0001-01-01 00:00:00 as the baseline. This function supports processing DATETIME types.

Date calculation formula:
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`) = min{`<origin>` + k × `<period>` × minute | k ∈ ℤ ∧ `<origin>` + k × `<period>` × minute ≥ `<date_or_time_expr>`}
K represents the number of periods needed from the baseline time to reach the target time.

## Syntax

```sql
MINUTE_CEIL(`<date_or_time_expr>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<origin>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`)
MINUTE_CEIL(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| --------- | ----------- |
| `<date_or_time_expr>` | The datetime value to be rounded up, of type DATETIME. For specific datetime formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion). |
| `<period>` | The minute interval value, of type INT, representing the number of minutes contained in each interval. |
| `<origin>` | The starting time point of the interval, of type DATETIME. Default value is 0001-01-01 00:00:00. |

## Return Value

Returns a value of type DATETIME, representing the time value after rounding up to the nearest specified minute interval based on the input datetime. The precision of the return value is the same as that of the input parameter datetime.

- If `<period>` is a non-positive integer (≤0), returns an error.
- If any parameter is NULL, returns NULL.
- If period is not specified, it defaults to a 1-minute interval.
- If `<origin>` is not specified, it defaults to 0001-01-01 00:00:00 as the baseline.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.
- If the calculation result exceeds the maximum datetime 9999-12-31 23:59:59, returns an error.

## Examples

```sql
-- Using default period of one minute and default origin time 0001-01-01 00:00:00
SELECT MINUTE_CEIL('2023-07-13 22:28:18') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 22:29:00 |
+---------------------+

-- Using five minutes as one period, rounding up with default origin point
SELECT MINUTE_CEIL('2023-07-13 22:28:18.123', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- If input datetime is exactly at a period starting point, return the input datetime
SELECT MINUTE_CEIL('2023-07-13 22:30:00', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Specifying origin time
SELECT MINUTE_CEIL('2023-07-13 22:28:18', 5, '2023-07-13 22:20:00') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Datetime with scale, all decimal places are truncated to 0
SELECT MINUTE_CEIL('2023-07-13 22:28:18.456789', 5) AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 22:30:00.000000 |
+----------------------------+

-- Input is of DATE type (default time 00:00:00)
SELECT MINUTE_CEIL('2023-07-13', 30) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- Calculation result exceeds maximum datetime 9999-12-31 23:59:59, returns error
SELECT MINUTE_CEIL('9999-12-31 23:59:18', 6);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation minute_ceil of 9999-12-31 23:59:18, 6 out of range

-- Period is non-positive, returns error
SELECT MINUTE_CEIL('2023-07-13 22:28:18', -5) AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation minute_ceil of 2023-07-13 22:28:18, -5 input wrong parameters, period can not be negative or zero

-- Any parameter is NULL, returns NULL
SELECT MINUTE_CEIL(NULL, 5), MINUTE_CEIL('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| minute_ceil(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
