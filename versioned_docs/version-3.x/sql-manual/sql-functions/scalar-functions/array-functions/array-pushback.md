---
{
    "title": "ARRAY_PUSHBACK",
    "language": "en",
    "description": "Add value to the end of the array"
}
---

## Description

Add value to the end of the array

## Syntax

```sql
ARRAY_PUSHBACK(<arr>, <value>)
```

## Parameters

| Parameter | Description |
|--|---|
| `<arr>` | Corresponding array |
| `<value>` | Value to be added |

## Return Value

Returns the array after adding value

## Example

```sql
SELECT ARRAY_PUSHBACK([1, 2], 3),ARRAY_PUSHBACK([3, 4], 6);
```

```text
+---------------------------+---------------------------+
| array_pushback([1, 2], 3) | array_pushback([3, 4], 6) |
+---------------------------+---------------------------+
| [1, 2, 3]                 | [3, 4, 6]                 |
+---------------------------+---------------------------+
```
