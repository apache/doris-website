---
{
    "title": "ARRAY_RANGE",
    "language": "en",
    "description": ":::tip quarter is supported since version 3.0.8 and 3.1.0. :::"
}
---

## Description

1. Generate int array
2. Generate date and time array

## Aliases

- SEQUENCE

## Syntax

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end>)
ARRAY_RANGE(<start>, <end>, <step>)
ARRAY_RANGE(<start_datetime>, <end_datetime>)
ARRAY_RANGE(<start_datetime>, <end_datetime>, INTERVAL <interval_step> <unit>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<start>` | The starting value is a positive integer, the default value is 0 |
| `<end>` | End value, a positive integer |
| `<step>` | Step size, a positive integer, default is 1 |
| `<start_datetime>` | Start date, datetimev2 type |
| `<end_datetime>` | End date, datetimev2 type |
| `<interval_step>` | Interval value, default is 1 |
| `<unit>` | Interval unit, supports year/quarter/month/week/day/hour/minute/second, default is day |

:::tip 
quarter is supported since version 3.0.8 and 3.1.0.
:::

## Return Value

1. Returns an array from start to end - 1, with a step length of step. If the third parameter step is negative or zero, the function result will be NULL
2. Returns an array of datetimev2 between start_datetime and the closest end_datetime (calculated by Interval_step UNIT). If the third argument interval_step is negative or zero, the function result will be NULL

## Example

```sql
SELECT ARRAY_RANGE(0,20,2),ARRAY_RANGE(cast('2019-05-15 12:00:00' as datetimev2(0)), cast('2022-05-17 12:00:00' as datetimev2(0)), interval 2 year);
```

```text
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| array_range(0, 20, 2)               | array_range_year_unit(cast('2019-05-15 12:00:00' as DATETIMEV2(0)), cast('2022-05-17 12:00:00' as DATETIMEV2(0)), 2) |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
| [0, 2, 4, 6, 8, 10, 12, 14, 16, 18] | ["2019-05-15 12:00:00", "2021-05-15 12:00:00"]                                                                       |
+-------------------------------------+----------------------------------------------------------------------------------------------------------------------+
```
