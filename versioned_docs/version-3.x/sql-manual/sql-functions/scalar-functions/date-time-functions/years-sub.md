---
{
    "title": "YEARS_SUB",
    "language": "en",
    "description": "Returns a new datetime value that is the result of subtracting a specified number of years from the input datetime."
}
---

## Description

Returns a new datetime value that is the result of subtracting a specified number of years from the input datetime.

## Syntax

```sql
YEARS_SUB(<date>, <years>)
```

## Parameters

| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<date>`      | The input datetime value, which can be of type DATETIME or DATE |
| `<years>`     | The number of years to subtract, of type INT         |

## Return Value

Returns a value with the same type as the input `<date>` (DATETIME or DATE), representing the time value after subtracting the specified number of years from the input datetime.

## Example

```sql
SELECT YEARS_SUB('2020-02-02 02:02:02', 1);
```

```text
+-------------------------------------+
| years_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2019-02-02 02:02:02                 |
+-------------------------------------+
```
