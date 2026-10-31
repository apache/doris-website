---
{
    "title": "WEEK_CEIL | Date Time Functions",
    "language": "en",
    "description": "Rounds up a datetime value to the nearest specified week interval. If a starting time (origin) is provided,",
    "sidebar_label": "WEEK_CEIL"
}
---

# WEEK_CEIL

## Description

Rounds up a datetime value to the nearest specified week interval. If a starting time (origin) is provided, it uses that time as the reference for calculating the interval.

## Syntax

```sql
WEEK_CEIL(<datetime>)
WEEK_CEIL(<datetime>, <origin>)
WEEK_CEIL(<datetime>, <period>)
WEEK_CEIL(<datetime>, <period>, <origin>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<datetime>`  | The datetime value to round up, of type DATETIME or DATETIMEV2 |
| `<period>`    | The week interval value, of type INT, representing the number of weeks in each interval |
| `<origin>`    | The starting point for the interval, of type DATETIME or DATETIMEV2; defaults to 0001-01-01 00:00:00 |

## Return Value

Returns a value of type DATETIME, representing the rounded-up datetime value. The time portion of the result will be set to 00:00:00.

**Note:**
- If no period is specified, it defaults to a 1-week interval.
- The period must be a positive integer.
- The result is always rounded up to a future time.
- The time portion of the returned value is always set to 00:00:00.

## Example

```sql
SELECT WEEK_CEIL('2023-07-13 22:28:18', 2);
```

```text
+-----------------------------------------------------------+
| week_ceil(cast('2023-07-13 22:28:18' as DATETIMEV2(0)), 2) |
+-----------------------------------------------------------+
| 2023-07-24 00:00:00                                       |
+-----------------------------------------------------------+
```
