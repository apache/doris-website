---
{
    "title": "HOUR_FLOOR",
    "language": "en"
}
---

## Description

The HOUR_FLOOR function rounds down the input datetime value to the nearest moment of the specified hour period. For example, if the period is specified as 5 hours, the function will adjust the input time to the starting hour mark within that period.

Datetime calculation formula:

$$
\text{HOUR\_FLOOR}(\langle\text{date\_or\_time\_expr}\rangle, \langle\text{period}\rangle, \langle\text{origin}\rangle) = \max\{\langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \mid k \in \mathbb{Z} \land \langle\text{origin}\rangle + k \times \langle\text{period}\rangle \times \text{day} \leq \langle\text{date\_or\_time\_expr}\rangle\}
$$

K represents the number of periods from the baseline time to the target time.

## Syntax

```sql
HOUR_FLOOR(`<date_or_time_expr>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<origin>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`)
HOUR_FLOOR(`<date_or_time_expr>`, `<period>`, `<origin>`)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date_or_time_expr>` | A valid date expression that supports datetime/date types. Date type will be converted to the start time 00:00:00 of the corresponding date. For specific datetime/date formats, please refer to [datetime conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion) and [date conversion](../../../../../docs/sql-manual/basic-element/sql-data-types/conversion/date-conversion) |
| `<period>` | Optional parameter that specifies the period length (unit: hours), must be a positive integer (such as 2, 6, 12). Default value is 1, representing one period every 1 hour |
| `<origin>` | The starting time origin, supports datetime/date types. If not provided, the default is 0001-01-01T00:00:00 |

## Return Value

Returns a DATETIME type value representing the nearest period moment after rounding down.

- If the input period is a non-positive integer, returns NULL.
- If any parameter is NULL, the result returns NULL.
- If origin or datetime has scale, the returned result has scale.

## Examples

```sql

-- Round down by 5-hour period, default origin is 0001-01-01 00:00:00
mysql> select hour_floor("2023-07-13 22:28:18", 5);
+--------------------------------------+
| hour_floor("2023-07-13 22:28:18", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Using 2023-07-13 08:00 as origin, divide by 4-hour periods
mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-13 08:00:00') as custom_origin;
+---------------------+
| custom_origin       |
+---------------------+
| 2023-07-13 16:00:00 |
+---------------------+

-- Input datetime exactly at period edge, return input datetime value
select hour_floor("2023-07-13 18:00:00", 5);
+--------------------------------------+
| hour_floor("2023-07-13 18:00:00", 5) |
+--------------------------------------+
| 2023-07-13 18:00:00                  |
+--------------------------------------+

-- Input date type will be converted to start time 2023-07-13 00:00:00 of the day
mysql> select hour_floor('2023-07-13 20:30:00', 4, '2023-07-13');
+----------------------------------------------------+
| hour_floor('2023-07-13 20:30:00', 4, '2023-07-13') |
+----------------------------------------------------+
| 2023-07-13 20:00:00                                |
+----------------------------------------------------+

-- If origin or datetime has scale, the returned result has scale
mysql> select hour_floor('2023-07-13 19:30:00.123', 4, '2023-07-03 08:00:00') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.000 |
+-------------------------+

mysql> select hour_floor('2023-07-13 19:30:00', 4, '2023-07-03 08:00:00.123') as custom_origin;
+-------------------------+
| custom_origin           |
+-------------------------+
| 2023-07-13 16:00:00.123 |
+-------------------------+

-- Input any parameter as NULL (returns NULL)
mysql> select hour_floor(null, 6) as null_input;
+------------+
| null_input |
+------------+
| NULL       |
+------------+

-- Period is negative, returns NULL
mysql> select hour_floor('2023-12-31 23:59:59', -3);
+---------------------------------------+
| hour_floor('2023-12-31 23:59:59', -3) |
+---------------------------------------+
| NULL                                  |
+---------------------------------------+

```