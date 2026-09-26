---
{
    "title": "QUARTERS_DIFF",
    "language": "en"
}
---

## Description

The `QUARTERS_DIFF` function calculates the number of quarters between two dates. This function accepts two date parameters and returns the difference in quarters after subtracting the second date from the first date. The difference in quarters is equivalent to the difference in months divided by 3 (rounded towards zero).

## Syntax

```sql
QUARTERS_DIFF(<enddate>, <startdate>)
```

## Parameters

| Parameter     | Description                                                                           |
|---------------|--------------------------------------------------------------------------------------|
| `<enddate>`   | End date. Supports `DATE`, `DATETIME`, or `TIMESTAMP_NS`. |
| `<startdate>` | Start date. Supports `DATE`, `DATETIME`, or `TIMESTAMP_NS`. |

## Return Value

Returns the number of quarters obtained by subtracting `<startdate>` from `<enddate>`
- When either `<enddate>` or `<startdate>` is NULL, returns NULL

## Examples

```sql
select QUARTERS_DIFF('2021-03-25', '2020-10-25'), QUARTERS_DIFF('2020-10-25 10:00:00', '2022-12-25 11:00:00');
```

```text
+------------------------------------------+------------------------------------------------------------+
| QUARTERS_DIFF('2021-03-25','2020-10-25') | QUARTERS_DIFF('2020-10-25 10:00:00','2022-12-25 11:00:00') |
+------------------------------------------+------------------------------------------------------------+
|                                        1 |                                                         -8 |
+------------------------------------------+------------------------------------------------------------+
```
