---
{
    "title": "YEARS_DIFF",
    "language": "en",
    "description": "Calculates the difference in years between two datetime values."
}
---

## Description

Calculates the difference in years between two datetime values.

## Syntax

```sql
YEARS_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<enddate>`      | The end date, which can be of type DATETIME or DATE |
| `<startdate>`     | The start date, which can be of type DATETIME or DATE |

## Return Value

Returns a value of type INT, representing the number of years between the two dates.

## Example

```sql
SELECT YEARS_DIFF('2020-12-25', '2019-10-25');
```

```text
+----------------------------------------------------------+
| years_diff('2020-12-25 00:00:00', '2019-10-25 00:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
```
