---
{
    "title": "HOURS_ADD",
    "language": "en"
}
---

## Description

Returns a new datetime value that is the result of adding a specified number of hours to the input datetime.

## Syntax

```sql
HOURS_ADD(<date>, <hours>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<hours>`     | The number of hours to add, of type INT         |

## Return Value

Returns a value of type DATETIME, representing the time value after adding the specified number of hours to the input datetime.

## Example

```sql
SELECT HOURS_ADD('2020-02-02 02:02:02', 1);
```

```text
+------------------------------------------------------------+
| hours_add(cast('2020-02-02 02:02:02' as DATETIMEV2(0)), 1) |
+------------------------------------------------------------+
| 2020-02-02 03:02:02                                        |
+------------------------------------------------------------+
```
