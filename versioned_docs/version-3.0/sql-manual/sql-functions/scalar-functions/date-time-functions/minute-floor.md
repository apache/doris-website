---
{
    "title": "MINUTE_FLOOR",
    "language": "en"
}
---

## Description

Rounds down a datetime value to the nearest specified minute interval. If a starting time (origin) is provided, it uses that time as the reference for calculating the interval.

## Syntax

```sql
MINUTE_FLOOR(<datetime>)
MINUTE_FLOOR(<datetime>, <origin>)
MINUTE_FLOOR(<datetime>, <period>)
MINUTE_FLOOR(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The datetime value to round down, of type DATETIME or DATETIMEV2 |
| `<period>`    | The minute interval value, of type INT, representing the number of minutes in each interval |
| `<origin>`    | The starting point for the interval, of type DATETIME or DATETIMEV2; defaults to 0001-01-01 00:00:00 |

## Return Value

Returns a value of type DATETIMEV2, representing the rounded-down datetime value.

## Example

```sql
SELECT MINUTE_FLOOR("2023-07-13 22:28:18", 5);
```

```text
+---------------------------------------------------------------+
| minute_floor(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+---------------------------------------------------------------+
| 2023-07-13 22:25:00                                           |
+---------------------------------------------------------------+
```

**Note:**
- If no period is specified, it defaults to a 1-minute interval.
- The period must be a positive integer.
- The result is always rounded down to a past time.
- Unlike MINUTE_CEIL, MINUTE_FLOOR always discards the portion that exceeds the interval.

## Best Practices

See also [date_floor](./date-floor)
