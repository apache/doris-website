---
{
    "title": "MICROSECONDS_DIFF",
    "language": "en"
}
---

## Description

Calculates the microsecond difference between two datetime values. The result is the number of microseconds from `<start_date>` subtracted from `<end_date>`.

## Syntax

```sql
MICROSECONDS_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| `<end_date>`    | The end time, of type DATETIMEV2               |
| `<start_date>`  | The start time, of type DATETIMEV2             |

## Return Value

Returns an INT type representing the microsecond difference between the two times.
- Returns a positive number if `<end_date>` is greater than `<start_date>`.
- Returns a negative number if `<end_date>` is less than `<start_date>`.
- 1 second = 1,000,000 microseconds.

## Example

```sql
SELECT MICROSECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| microseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(3)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(3))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                      500000 |
+-----------------------------------------------------------------------------------------------------------------------------+
```
