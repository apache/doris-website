---
{
  "title": "DAY_CEIL",
  "language": "en"
}
---

## Description

The DAY_CEIL function is used to round up a specified date or time value to the start of the nearest specified day period. It returns the smallest period moment that is not less than the input date and time. The period rule is defined jointly by period (number of days in the period) and origin (starting reference time). If no starting reference time is specified, it defaults to 0001-01-01 00:00:00 as the calculation basis.

Date calculation formula:

$$
\text{DAY\_CEIL}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \min\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \geq \langle\text{date\_or\_time\_expr}\rangle\}
$$

where K represents the number of periods required to reach the target time from the reference time.

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
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Specifies the number of days in each period, of type INT. If not specified, the default period is 1 day. |
| `<origin>` | The starting reference time for period calculation, supports date/datetime types |

## Return Value

Returns a date or time value representing the result of rounding up the input value to the specified day period.

If the input is valid, returns a rounding result consistent with the datetime type:

When input is DATE, returns DATE;
When input is DATETIME, returns DATETIME (including date and time, with the time part being 00:00:00, since the period is based on days).

Special cases:

- When any parameter is NULL, returns NULL;
- If period is negative or 0, returns an error;
- If the rounding result exceeds the supported range of date types (such as after '9999-12-31'), an error is reported.
- For datetime input with scale, the output will truncate all scale to 0, and the return value will have scale
- If the `<origin>` date and time is after the `<period>`, it will still be calculated according to the above formula, but the period k will be negative.

## Examples

```sql

---Round up with a period of five days
select day_ceil( cast("2023-07-13 22:28:18" as datetime), 5);

+------------------------------------+
| day_ceil("2023-07-13 22:28:18", 5) |
+------------------------------------+
| 2023-07-15 00:00:00                |
+------------------------------------+

---Datetime input with scale, return value has scale with all decimals as 0

select day_ceil( "2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_ceil( "2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-15 00:00:00.000                 |
+-----------------------------------------+

---Without specifying period, default to round up by one day
select day_ceil("2023-07-13 22:28:18");

+---------------------------------+
| day_ceil("2023-07-13 22:28:18") |
+---------------------------------+
| 2023-07-14 00:00:00             |
+---------------------------------+

---Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

---Date and time is exactly at the start of the period
select day_ceil("2023-07-16 00:00:00", 7, "2023-01-01 00:00:00");
+-----------------------------------------------------------+
| day_ceil("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+-----------------------------------------------------------+
| 2023-07-16 00:00:00                                       |
+-----------------------------------------------------------+

---Input is DATE type, period is 3 days
select day_ceil(cast("2023-07-13" as date), 3);

+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 3) |
+-----------------------------------------+
| 2023-07-14                              |
+-----------------------------------------+

--- If the <origin> date and time is after the <period>, it will still be calculated according to the above formula, but the period k will be negative.
select day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00');
+---------------------------------------------------------------+
| day_ceil('2023-07-13 19:30:00.123', 4, '2028-07-14 08:00:00') |
+---------------------------------------------------------------+
| 2023-07-17 08:00:00.000                                       |
+---------------------------------------------------------------+

---Period time is zero, returns NULL
select day_ceil(cast("2023-07-13" as date), 0);
+-----------------------------------------+
| day_ceil(cast("2023-07-13" as date), 0) |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+

---Period is negative
mysql> select day_ceil("2023-07-13 22:28:18", -2);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 2023-07-13 22:28:18, -2 out of range

---Return date exceeds maximum range, returns error
select day_ceil("9999-12-31", 5);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[E-218]Operation day_ceil of 9999-12-31 00:00:00, 5 out of range

---Any parameter is NULL, returns NULL
select day_ceil(NULL, 5, "2023-01-01");

+---------------------------------+
| day_ceil(NULL, 5, "2023-01-01") |
+---------------------------------+
| NULL                            |
+---------------------------------+
```
