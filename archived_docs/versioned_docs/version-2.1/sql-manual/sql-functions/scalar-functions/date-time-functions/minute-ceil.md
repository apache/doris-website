---
{
    "title": "MINUTE_CEIL",
    "language": "en",
    "description": "Rounds up a datetime value to the nearest specified minute interval. If a starting time (origin) is provided,"
}
---

## Description

Rounds up a datetime value to the nearest specified minute interval. If a starting time (origin) is provided, it uses that time as the reference for calculating the interval.

## Syntax

```sql
MINUTE_CEIL(<datetime>)
MINUTE_CEIL(<datetime>, <origin>)
MINUTE_CEIL(<datetime>, <period>)
MINUTE_CEIL(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The datetime value to round up, of type DATETIME or DATETIMEV2 |
| `<period>`    | The minute interval value, of type INT, representing the number of minutes in each interval |
| `<origin>`    | The starting point for the interval, of type DATETIME or DATETIMEV2; defaults to 0001-01-01 00:00:00 |

## Return Value

Returns a value of type DATETIMEV2, representing the rounded-up datetime value based on the specified minute interval. The precision of the return value is the same as that of the input parameter datetime.

## Example

```sql
SELECT MINUTE_CEIL("2023-07-13 22:28:18", 5);
```

```text
+--------------------------------------------------------------+
| minute_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 5) |
+--------------------------------------------------------------+
| 2023-07-13 22:30:00                                          |
+--------------------------------------------------------------+
```

**Note:**
- If no period is specified, it defaults to a 1-minute interval.
- The period must be a positive integer.
- The result is always rounded up to a future time.

## Best Practices

See also [date_ceil](./date-ceil)
