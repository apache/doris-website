---
{
    "title": "DAY_CEIL",
    "language": "en",
    "description": "The dayceil function rounds up a specified date or time value to the start of the nearest specified day period."
}
---

## Description


The day_ceil function rounds up a specified date or time value to the start of the nearest specified day period. The period rule is defined by period (number of days) and origin (reference time). If origin is not specified, it defaults to 0001-01-01 00:00:00.

Date calculation formula:
$$
\begin{aligned}
&\text{day\_ceil}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \\
&\min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid \\
&k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \geq \langle\text{date\_or\_time\_expr}\rangle\}
\end{aligned}
$$
$k$ represents the number of periods needed from the baseline time to reach the target time.

## Syntax

```sql
DAY_CEIL(<date_or_time_expr>)
DAY_CEIL(<date_or_time_expr>, <origin>)
DAY_CEIL(<date_or_time_expr>, <period>)
DAY_CEIL(<date_or_time_expr>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime/timestamptz types. For specific formats please see [timestamptz conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Specifies the number of days in each period, of type INT. If not specified, the default period is 1 day. |
| `<origin>` | The starting reference time for period calculation, supports date/datetime types |

## Return Value

Returns TIMESTAMPTZ, DATETIME or DATE, representing the result of rounding up the input value to the specified day period.

If the input is valid, returns a rounding result consistent with the datetime type:

- If input is TIMESTAMPTZ, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when session variable is `+08:00`), and then perform DAY_CEIL.
- If `<date_or_time_expr>` and `<period>` contain both TIMESTAMPTZ and DATETIME, return DATETIME type.

Special cases:

- When any parameter is NULL, returns NULL;
- If period is negative or 0, returns an error;
- If the rounding result exceeds the supported range of date types (such as after '9999-12-31'), an error is reported.
- For datetime input with scale, the output will truncate all decimal to 0, and the return value will have scale
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql
-- Round up with a period of five days
select day_ceil( cast("2023-07-13 22:28:18" as datetime), 5);

+------------------------------------+
| day_ceil("2023-07-13 22:28:18", 5) |
+------------------------------------+
| 2023-07-15 00:00:00                |
+------------------------------------+

-- Datetime input with scale, return value has scale with all decimals as 0
select day_ceil( "2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_ceil( "2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-15 00:00:00.000                 |
+-----------------------------------------+

-- Without specifying period, default to round up by one day
select day_ceil("2023-07-13 22:28:18");

+---------------------------------+
| day_ceil("2023-07-13 22:28:18") |
+---------------------------------+
| 2023-07-14 00:00:00             |
+---------------------------------+

-- Only with origin date and specified date
select day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34");
+--------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", "2021-07-01 12:22:34") |
+--------------------------------------------------------+
| 2023-07-14 12:22:34                                    |
+--------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Date and time is exactly at the start of the period
select day_ceil("2023-07-16 00:00:00", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_ceil(cast("2023-07-13" as date), 3);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 3) |
+-----------------------------------------+
| 2023-07-14                              |
+-----------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_CEIL
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00');
+---------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00') |
+---------------------------------------+
| 2026-01-02 00:00:00+08:00             |
+---------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+------------------------------------------------------------------+
| DAY_CEIL('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+------------------------------------------------------------------+
| 2026-01-02 00:00:00.123                                          |
+------------------------------------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+---------------------------------------------------------------+
| day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+---------------------------------------------------------------+
| 2023-07-17 08:00:00.000                                       |
+---------------------------------------------------------------+

-- Period time is zero, returns NULL
select day_ceil(cast("2023-07-13" as date), 0);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 0) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+

-- Period is negative
mysql> select day_ceil("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 2023-07-13 22:28:18, -2 out of range

-- Return date exceeds maximum range, returns error
select day_ceil("9999-12-31", 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 9999-12-31 00:00:00, 5 out of range

-- Any parameter is NULL, returns NULL
select day_ceil(NULL, 5, "2023-01-01");

+---------------------------------+
| day_ceil(NULL, 5, "2023-01-01") |
+---------------------------------+
| NULL                            |
+---------------------------------+
```
