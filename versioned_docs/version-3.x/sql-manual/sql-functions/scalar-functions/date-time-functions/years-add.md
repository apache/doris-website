---
{
    "title": "YEARS_ADD",
    "language": "en",
    "description": "Returns a new datetime value that is the result of adding a specified number of years to the input datetime."
}
---

## Description

Returns a new datetime value that is the result of adding a specified number of years to the input datetime.

## Syntax

```sql
YEARS_ADD(<date>, <years>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<years>`     | The number of years to add, of type INT         |

## Return Value

Returns a value with the same type as the input `<date>` (DATETIME or DATE), representing the time value after adding the specified number of years to the input datetime.

## Example

```sql
SELECT YEARS_ADD('2020-01-31 02:02:02', 1);
```

```text
+-------------------------------------+
| years_add('2020-01-31 02:02:02', 1) |
+-------------------------------------+
| 2021-01-31 02:02:02                 |
+-------------------------------------+
```
