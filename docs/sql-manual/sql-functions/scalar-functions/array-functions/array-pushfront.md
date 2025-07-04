---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "en"
}
---

## Description

Add value to the beginning of the array

## Syntax

```sql
ARRAY_PUSHFRONT(<arr>, <value>)
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
SELECT ARRAY_PUSHFRONT([1, 2], 3),ARRAY_PUSHFRONT([3, 4], 6);
```

```text
+----------------------------+----------------------------+
| array_pushfront([1, 2], 3) | array_pushfront([3, 4], 6) |
+----------------------------+----------------------------+
| [3, 1, 2]                  | [6, 3, 4]                  |
+----------------------------+----------------------------+
```
