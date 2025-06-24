---
{
    "title": "ARRAY_UNION",
    "language": "en"
}
---

## Description

Merge multiple arrays without duplicate elements to generate a new array

## Syntax

```sql
ARRAY_UNION(<array>, <array> [, ... ])
```

## Parameters

| Parameter | Description |
|--|--|
| `<array>` | The array to be merged |

## Return Value

Returns an array containing all elements in the union of all arrays, excluding duplicates. If the input parameter is NULL, it returns NULL.

## Example

```sql
SELECT ARRAY_UNION([1, 2, 3, 6],[1, 2, 5]),ARRAY_UNION([1, 4, 3, 5, NULL],[1,6,10]);
```

```text
+--------------------------------------+---------------------------------------------+
| array_union([1, 2, 3, 6], [1, 2, 5]) | array_union([1, 4, 3, 5, NULL], [1, 6, 10]) |
+--------------------------------------+---------------------------------------------+
| [3, 2, 1, 6, 5]                      | [null, 10, 3, 1, 6, 4, 5]                   |
+--------------------------------------+---------------------------------------------+
```
