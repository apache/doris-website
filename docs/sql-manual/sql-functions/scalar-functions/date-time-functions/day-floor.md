---
{
  "title": "DAY_FLOOR",
  "language": "en"
}
---

## Description

The DAY_FLOOR function is used to round down a specified date or time value to the start of the nearest specified day period. It returns the largest period moment that is not greater than the input date and time. The period rule is defined jointly by period (number of days in the period) and origin (starting reference time). If no starting reference time is specified, it defaults to 0001-01-01 00:00:00 as the calculation basis.

Date calculation formula
DAY_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`) = max{`<origin>` + k × `<period>` × day | k ∈ ℤ ∧ `<origin>` + k × `<period>` × day ≤ `<date_or_time_expr>`}
K represents the number of periods from the reference time to the target time

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
| `<date_or_time_expr>` | A valid date expression that supports date/datetime types. For specific datetime and date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Specifies the number of days in each period, of type INT. If negative or 0, returns NULL; if not specified, the default period is 1 day. |
| `<origin>` | The starting reference time for period calculation, supports date/datetime types |

## Return Value

Returns a date or time value representing the result of rounding down the input value to the specified day period.

If the input is valid, returns a rounding result consistent with the datetime type:

When input is DATE, returns DATE
When input is DATETIME, returns DATETIME (including date and time, with the time part being 00:00:00, since the period is based on days).

Special cases:

- When any parameter is NULL, returns NULL;
- If period is negative or 0, returns NULL;
- For datetime input with scale, the output will have scale with all decimals as 0

## Examples

```sql
---Round down with a period of five days
select day_floor("2023-07-13 22:28:18", 5);

+-------------------------------------+
| day_floor("2023-07-13 22:28:18", 5) |
+-------------------------------------+
| 2023-07-10 00:00:00                 |
+-------------------------------------+


---Datetime input with scale, return value has scale with all decimals as 0
mysql> select day_floor("2023-07-13 22:28:18.123", 5);
+-----------------------------------------+
| day_floor("2023-07-13 22:28:18.123", 5) |
+-----------------------------------------+
| 2023-07-10 00:00:00.000                 |
+-----------------------------------------+


---Input parameter without period, default to one day as period
select day_floor("2023-07-13 22:28:18");
+----------------------------------+
| day_floor("2023-07-13 22:28:18") |
+----------------------------------+
| 2023-07-13 00:00:00              |
+----------------------------------+

---Specify period as 7 days (1 week), custom reference time as 2023-01-01 00:00:00
select day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-13 22:28:18", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

---Start time is exactly at the beginning of a period, returns input date time
select day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00");
+------------------------------------------------------------+
| day_floor("2023-07-09 00:00:00", 7, "2023-01-01 00:00:00") |
+------------------------------------------------------------+
| 2023-07-09 00:00:00                                        |
+------------------------------------------------------------+

---Input is DATE type, period is 3 days
select day_floor(cast("2023-07-13" as date), 3);
+------------------------------------------+
| day_floor(cast("2023-07-13" as date), 3) |
+------------------------------------------+
| 2023-07-11                               |
+------------------------------------------+

---Period is negative, returns NULL
select day_floor("2023-07-13 22:28:18", -2);
+--------------------------------------+
| day_floor("2023-07-13 22:28:18", -2) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+

---Period is 0, returns NULL
select day_floor("2023-07-13 22:28:18", 0);
+-------------------------------------+
| day_floor("2023-07-13 22:28:18", 0) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+

---Any parameter is NULL, returns NULL
select day_floor(NULL, 5, "2023-01-01");
+----------------------------------+
| day_floor(NULL, 5, "2023-01-01") |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

## Description

Rounds the date down to the nearest timestamp of the specified time interval period.

## Syntax

```sql
DAY_FLOOR(<datetime>)
DAY_FLOOR(<datetime>, <origin>)
DAY_FLOOR(<datetime>, <period>)
DAY_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<datetime>` | A valid date expression |
| `<period>` | Specifies how many days make up each period |
| `<origin>` | The starting point of time. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns the date of the nearest rounded-up timestamp.

## Examples

```sql
select day_floor("2023-07-13 22:28:18", 5);
```

```text
+------------------------------------------------------------+
| day_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+------------------------------------------------------------+
| 2023-07-12 00:00:00                                        |
+------------------------------------------------------------+
```
