---
{
    "title": "HOURS_DIFF",
    "language": "en",
    "description": "Calculates the difference in hours between the start time and the end time."
}
---

## Description

Calculates the difference in hours between the start time and the end time.

## Syntax

```sql
HOURS_DIFF(<end_date>, <start_date>)
```

## Parameters

| Parameter  | Description                                     |
|------------|-------------------------------------------------|
| `<end_date>`    | The end time, which can be of type DATETIME or DATE |
| `<start_date>`  | The start time, which can be of type DATETIME or DATE |

## Return Value

Returns an INT type representing the number of hours between the start time and the end time.

## Example

```sql
SELECT HOURS_DIFF('2020-12-25 22:00:00', '2020-12-25 21:00:00');
```

```text
+--------------------------------------------------------------------------------------------------------+
| hours_diff(cast('2020-12-25 22:00:00' as DATETIMEV2(0)), cast('2020-12-25 21:00:00' as DATETIMEV2(0))) |
+--------------------------------------------------------------------------------------------------------+
|                                                                                                      1 |
+--------------------------------------------------------------------------------------------------------+
```