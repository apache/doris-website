---
{
    "title": "MONTHS_DIFF",
    "language": "en"
}
---

## Description
The `MONTHS_DIFF` function calculates the number of complete months between two dates. It accepts two date arguments and returns the difference in months as an integer.

## Syntax

```sql
MONTHS_DIFF(<enddate>, <startdate>)
```

## Parameters

| 参数            | 说明                                                                                                                                                                      |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<enddate>`   | The ending date, representing the later date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types.     |
| `<startdate>` | The starting date, representing the earlier date in the difference calculation. Supports `DATE` (e.g., `YYYY-MM-DD`) or `DATETIME` (e.g., `YYYY-MM-DD HH:MM:SS`) types. |

## Return Value

returns the number of months resulting from `<enddate>` minus `<startdate>`
- When either `<enddate>` or `<startdate>` is NULL, or both are NULL, it returns NULL


## Example

```sql
select months_diff('2020-12-25','2020-10-25'),months_diff('2020-10-25 10:00:00','2020-12-25 11:00:00');
```

```text
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
| months_diff(cast('2020-12-25' as DATETIMEV2(0)), cast('2020-10-25' as DATETIMEV2(0))) | months_diff(cast('2020-10-25 10:00:00' as DATETIMEV2(0)), cast('2020-12-25 11:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                                                                                     2 |                                                                                                      -2 |
+---------------------------------------------------------------------------------------+---------------------------------------------------------------------------------------------------------+
```
