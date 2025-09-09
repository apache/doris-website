---
{
    "title": "MONTH_FLOOR",
    "language": "en"
}
---

## Description

The MONTH_FLOOR function rounds the input datetime value down to the nearest specified month interval. If an origin time is specified, it uses that time as the baseline for dividing intervals and rounding; if not specified, it defaults to 0001-01-01 00:00:00 as the baseline. This function supports processing DATETIME and DATE types.

Date calculation formula:
MONTH_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × month | k ∈ ℤ ∧ `<origin>` + k × `<period>` × month ≤ `<date_or_time_expr>`}
K represents the number of periods from the baseline time to the target time.

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
| `<datetime>` | The datetime value to be rounded down, of type DATETIME and DATE. For specific datetime formats, see [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion). |
| `<period>` | The month interval value, of type INT, representing the number of months contained in each interval. |
| `<origin>` | The starting time point of the interval, of type DATETIME and DATE. Default value is 0001-01-01 00:00:00. |

## Return Value

Returns a value of type DATETIME, representing the time value after rounding down to the nearest specified month interval based on the input datetime. The time component of the result will be set to 00:00:00, and the day component will be truncated to 01.

- If `<period>` is a non-positive integer (≤0), returns NULL.
- If any parameter is NULL, returns NULL.
- If period is not specified, it defaults to a 1-month interval.
- If `<origin>` is not specified, it defaults to 0001-01-01 00:00:00 as the baseline.
- If the input is of DATE type (only includes year, month, and day), its time part defaults to 00:00:00.

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

-- Input is of DATE type (default time 00:00:00)
SELECT MONTH_FLOOR('2023-07-13', 3) AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-01 00:00:00 |
+---------------------+

-- Period is non-positive, returns NULL
SELECT MONTH_FLOOR('2023-07-13 22:28:18', -5) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+

-- Any parameter is NULL, returns NULL
SELECT MONTH_FLOOR(NULL, 5), MONTH_FLOOR('2023-07-13 22:28:18', NULL) AS result;
+-----------------------+--------+
| month_floor(NULL, 5)  | result |
+-----------------------+--------+
| NULL                  | NULL   |
+-----------------------+--------+
```
