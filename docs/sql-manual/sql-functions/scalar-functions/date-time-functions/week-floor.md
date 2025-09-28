---
{
    "title": "WEEK_FLOOR",
    "language": "en"
}
---

## Description

The WEEK_FLOOR function rounds down an input datetime value to the nearest specified week interval start time, with the interval unit being WEEK. If a starting reference point (origin) is specified, it uses that point as the basis for calculating intervals; otherwise, it defaults to using 0000-01-01 00:00:00 as the reference point.

Date calculation formula:
$$
\text{WEEK\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{WEEK} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
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
| `<date_or_time_expr>` | The datetime value to round down, supports date/datetime types. For datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion)|
| `<period>` | Week interval value, type INT, representing the number of weeks in each interval |
| `<origin>` | Starting point for the interval, supports date/datetime types; defaults to 0000-01-01 00:00:00 |

## Return Value

Returns DATETIME type, representing the rounded-down datetime value. The time portion of the result will be set to 00:00:00.

- If `<period>` is a non-positive (≤0), the function returns error;
- If any parameter is NULL, returns NULL;
- If `<datetime>` is exactly at an interval start point (based on `<period>` and `<origin>`), returns that start point;
- If input is date type, returns date type
- If input is datetime type, returns datetime type with the same time portion as the origin time.
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.
- If date_or_time_expr has a scale, the returned result will also have a scale with the fractional part being zero.

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

--inpput with decimal part
mysql> SELECT WEEK_FLOOR('2023-07-13 22:28:18.123', 2) AS result;
+-------------------------+
| result                  |
+-------------------------+
| 2023-07-10 00:00:00.000 |
+-------------------------+

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

-- Invalid period
-- 无效period，返回错误
SELECT WEEK_FLOOR('2023-07-13', 0) AS result;
RROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation week_floor of 2023-07-13 00:00:00, 0 out of range

-- Parameter is NULL
SELECT WEEK_FLOOR(NULL, 1) AS result;
+--------+
| result |
+--------+
| NULL   |
+--------+
```
