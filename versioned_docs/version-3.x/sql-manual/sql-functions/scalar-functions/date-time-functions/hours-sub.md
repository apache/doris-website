---
{
    "title": "HOURS_SUB",
    "language": "en",
    "description": "Returns a new datetime value that is the result of subtracting a specified number of hours from the input datetime."
}
---

## Description

Returns a new datetime value that is the result of subtracting a specified number of hours from the input datetime.

## Syntax

```sql
HOURS_SUB(<date>, <hours>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<hours>`     | The number of hours to subtract, of type INT     |

## Return Value

Returns a value of type DATETIME, representing the time value after subtracting the specified number of hours from the input datetime.

## Example

```sql
SELECT HOURS_SUB('2020-02-02 02:02:02', 1);
```

```text
+------------------------------------------------------------+
| hours_sub(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 01:02:02                                        |
+------------------------------------------------------------+
```
