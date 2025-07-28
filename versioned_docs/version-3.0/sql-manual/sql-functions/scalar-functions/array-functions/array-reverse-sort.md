---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "en"
}
---

## Description

Sort the elements in an array in descending order

## Syntax

```sql
ARRAY_REVERSE_SORT(<arr>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |

## Return Value

Returns an array sorted in descending order. If the input array is NULL, it returns NULL. If the array element contains NULL, the output sorted array will put NULL at the end.

## Example

```sql
SELECT ARRAY_REVERSE_SORT([1, 2, 3, 6]),ARRAY_REVERSE_SORT([1, 4, 3, 5, NULL]),ARRAY_REVERSE_SORT([NULL]);
```

```text
+----------------------------------+----------------------------------------+----------------------------+
| array_reverse_sort([1, 2, 3, 6]) | array_reverse_sort([1, 4, 3, 5, NULL]) | array_reverse_sort([NULL]) |
+----------------------------------+----------------------------------------+----------------------------+
| [6, 3, 2, 1]                     | [5, 4, 3, 1, null]                     | [null]                     |
+----------------------------------+----------------------------------------+----------------------------+
```
