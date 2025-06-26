---
{
    "title": "ARRAY_SUM",
    "language": "en"
}
---

## Description

Calculates the sum of all elements in an array

## Syntax

```sql
ARRAY_SUM(<src>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<src>` | Corresponding array |

## Return Value

Returns the sum of all elements in the array. NULL values in the array will be skipped. For an empty array or an array with all NULL values, the result returns a NULL value.

## Example

```sql
SELECT ARRAY_SUM([1, 2, 3, 6]),ARRAY_SUM([1, 4, 3, 5, NULL]),ARRAY_SUM([NULL]);
```

```text
+-------------------------+-------------------------------+-------------------------------------------+
| array_sum([1, 2, 3, 6]) | array_sum([1, 4, 3, 5, NULL]) | array_sum(cast([NULL] as ARRAY<BOOLEAN>)) |
+-------------------------+-------------------------------+-------------------------------------------+
|                      12 |                            13 |                                      NULL |
+-------------------------+-------------------------------+-------------------------------------------+
```
