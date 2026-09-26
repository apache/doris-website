---
{
    "title": "QUARTER_FLOOR",
    "language": "en",
    "description": "Rounds a DATE, DATETIME, TIMESTAMP_NS, or TIMESTAMPTZ value down to the nearest boundary of a specified quarter period."
}
---

## Description

Rounds a `DATE`, `DATETIME`, `TIMESTAMP_NS`, or `TIMESTAMPTZ` value down to the nearest specified quarter period boundary. If an origin time is specified, the period is calculated based on that time.

## Syntax

```sql
QUARTER_FLOOR(<datetime>)
QUARTER_FLOOR(<datetime>, <origin>)
QUARTER_FLOOR(<datetime>, <period>)
QUARTER_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description |
| ---- | ---- |
| `<datetime>` | The value to round down. Supports `DATE`, `DATETIME`, `TIMESTAMP_NS`, and `TIMESTAMPTZ`. |
| `<period>` | Quarter period value, type is INT, representing the number of quarters contained in each period |
| `<origin>` | The starting point of the period. Supports `DATE`, `DATETIME`, `TIMESTAMP_NS`, and `TIMESTAMPTZ`; the default is 0001-01-01 00:00:00. |

Notes:
- When period is not specified, it is equivalent to using 1 quarter as the period
- When period is not a positive integer, the function result will be NULL
- The result always rounds to the past time
- The time part of the return value is always 00:00:00

## Return Value

A `TIMESTAMP_NS` input returns `TIMESTAMP_NS` with fixed nine-digit fractional-second precision. Results are validated against the range of the return type; `TIMESTAMP_NS` uses its range of `[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]`.

When `<origin>` is omitted for a `TIMESTAMP_NS` input, the documented default origin is used only as an internal alignment reference; it does not need to fall within the storable `TIMESTAMP_NS` range.

When `<datetime>` is of DATE type, the return type is DATE.
When `<datetime>` is of DATETIME type, the return type is DATETIME.
When `<datetime>` is of TIMESTAMP_NS type, the return type is TIMESTAMP_NS with nine fractional-second digits.
When `<datetime>` is of TIMESTAMPTZ type, the return type is TIMESTAMPTZ.
The time part of the result will be set to 00:00:00.

## Examples

Starting from '0001-01-01 00:00:00', with periods of 5 / 4 quarters each, return the period start point closest to the input date.
```sql
SELECT QUARTER_FLOOR("2023-07-13 22:28:18", 5), QUARTER_FLOOR("2023-07-13 22:28:18", 4);
```

```text
+-----------------------------------------+-----------------------------------------+
| QUARTER_FLOOR("2023-07-13 22:28:18", 5) | QUARTER_FLOOR("2023-07-13 22:28:18", 4) |
+-----------------------------------------+-----------------------------------------+
| 2021-01-01 00:00:00                     | 2022-01-01 00:00:00                     |
+-----------------------------------------+-----------------------------------------+
```

Using '2022-01-01 00:00:00' as the period start point, with periods of 2 / 4 quarters each, return the period start point closest to the input date.
```sql
SELECT QUARTER_FLOOR("2023-03-13 22:28:18", 2, "2022-01-01 00:00:00"), QUARTER_FLOOR("2023-07-13 22:28:18", 4, "2022-01-01 00:00:00");
```

```text
+----------------------------------------------------------------+----------------------------------------------------------------+
| QUARTER_FLOOR("2023-03-13 22:28:18", 2, "2022-01-01 00:00:00") | QUARTER_FLOOR("2023-07-13 22:28:18", 4, "2022-01-01 00:00:00") |
+----------------------------------------------------------------+----------------------------------------------------------------+
| 2023-01-01 00:00:00                                            | 2022-01-01 00:00:00                                            |
+----------------------------------------------------------------+----------------------------------------------------------------+
```

## Best Practices

See also [date_floor](./date-floor)
