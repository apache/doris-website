---
{
    "title": "LAST_DAY",
    "language": "en",
    "description": "Returns the date of the last day of the month for the given input date. The returned day varies depending on the month:"
}
---

## Description

Returns the date of the last day of the month for the given input date. The returned day varies depending on the month:
- 28th - For February in non-leap years
- 29th - For February in leap years
- 30th - For April, June, September, and November
- 31st - For January, March, May, July, August, October, and December

## Syntax

```sql
LAST_DAY(<date>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>` | Input datetime value, type can be DATETIME or DATE |

## Return Value

Returns a value of type DATE representing the last day of the month for the given input date.

## Example

```sql
SELECT LAST_DAY('2000-02-03');
```

```text
+-----------------------------------------------+
| last_day(cast('2000-02-03' as DATETIMEV2(0))) |
+-----------------------------------------------+
| 2000-02-29                                    |
+-----------------------------------------------+
```
