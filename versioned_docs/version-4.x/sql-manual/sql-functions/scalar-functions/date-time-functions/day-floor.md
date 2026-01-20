---
{
    "title": "DAY_FLOOR",
    "language": "en",
    "description": "The DAYFLOOR function is used to round down a specified date or time value to the start of the nearest specified day period."
}
---

## Description

The DAY_FLOOR function is used to round down a specified date or time value to the start of the nearest specified day period. It returns the largest period moment that is not greater than the input date and time. The period rule is defined jointly by period (number of days in the period) and origin (starting reference time). If no starting reference time is specified, it defaults to 0001-01-01 00:00:00 as the calculation basis.

Date calculation formula:

$$
\text{DAY\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$
$k$ represents the number of periods from the reference time to the target time.

## Syntax

```sql
DAY_FLOOR(<date_or_time_expr>)
DAY_FLOOR(<date_or_time_expr>, <origin>)
DAY_FLOOR(<date_or_time_expr>, <period>)
DAY_FLOOR(<date_or_time_expr>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports date/datetime/timestamptz types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific formats please see [timestamptz conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion), [datetime conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Specifies the number of days in each period, of type INT. If negative or 0, returns NULL; if not specified, the default period is 1 day. |
| `<origin>` | The starting reference time for period calculation, supports date/datetime types |

## Return Value

Returns TIMESTAMPTZ, DATETIME or DATE, representing the result of rounding down the input value to the specified day period.

If the input is valid, returns a rounding result consistent with the datetime type:

- If input is TIMESTAMPTZ, it will first be converted to local_time (for example: `2025-12-31 23:59:59+05:00` represents local_time `2026-01-01 02:59:59` when session variable is `+08:00`), and then perform DAY_FLOOR.
- If `<date_or_time_expr>` and `<period>` contain both TIMESTAMPTZ and DATETIME, output is DATETIME.

Special cases:

- When any parameter is NULL, returns NULL;
- If period is negative or 0, returns error;
- For datetime input with scale, the output will have scale with all decimals as 0
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql
-- Round down with a period of five days
select day_floor("2023-07-13 22:28:18", 5);

+-------------------------------------+
| day_floor("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-10 00:00:00                 |
+-------------------------------------+


-- Datetime input with scale, return value has scale with all decimals as 0
mysql> select day_floor("2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_floor("2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-10 00:00:00.000                 |
+-----------------------------------------+


-- Input parameter without period, default to one day as period
select day_floor("2023-07-13 22:28:18");
+----------------------------------+
| day_floor("2023-07-13 22:28:18") |
+----------------------------------+
| 2023-07-13 00:00:00              |
+----------------------------------+

-- Only with origin date and specified date
select day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00");
+---------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", "2023-01-01 12:00:00") |
+---------------------------------------------------------+
| 2023-07-13 12:00:00                                     |
+---------------------------------------------------------+

-- Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Start time is exactly at the beginning of a period, returns input date time
select day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

-- Input is DATE type, period is 3 days
select day_floor(cast("2023-07-13" as date), 3);
+------------------------------------------+
| day_floor(cast("2023-07-13" as date), 3) |
+------------------------------------------+
| 2023-07-11                               |
+------------------------------------------+

-- TimeStampTz sample, SET time_zone = '+08:00'
-- Convert to local_time (2026-01-01 02:59:59) and then perform DAY_FLOOR
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00');
+----------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00') |
+----------------------------------------+
| 2026-01-01 00:00:00+08:00              |
+----------------------------------------+

-- If parameters contain both TimeStampTz and Datetime types, output DateTime type
SELECT DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123');
+-------------------------------------------------------------------+
| DAY_FLOOR('2025-12-31 23:59:59+05:00', '2025-12-15 00:00:00.123') |
+-------------------------------------------------------------------+
| 2026-01-01 00:00:00.123                                           |
+-------------------------------------------------------------------+

-- Period is negative, returns error
select day_floor("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_floor of 2023-07-13 22:28:18, -2 out of range

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+----------------------------------------------------------------+
| day_floor('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+----------------------------------------------------------------+
| 2023-07-13 08:00:00.000                                        |
+----------------------------------------------------------------+

-- Any parameter is NULL, returns NULL
select day_floor(NULL, 5, "2023-01-01");
+----------------------------------+
| day_floor(NULL, 5, "2023-01-01") |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
