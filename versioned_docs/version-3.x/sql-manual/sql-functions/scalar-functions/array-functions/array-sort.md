---
{
    "title": "ARRAY_SORT",
    "language": "en"
}
---

## Description

Sort the elements in an array in ascending order

## Syntax

```sql
ARRAY_SORT(<arr>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |

## Return Value

Returns an array sorted in ascending order. If the input array is NULL, it returns NULL. If the array elements contain NULL, the output sorted array will put NULL first.

## Example

```sql
SELECT ARRAY_SORT([1, 2, 3, 6]),ARRAY_SORT([1, 4, 3, 5, NULL]),ARRAY_SORT([NULL]);
```

```text
+--------------------------+--------------------------------+--------------------+
| array_sort([1, 2, 3, 6]) | array_sort([1, 4, 3, 5, NULL]) | array_sort([NULL]) |
+--------------------------+--------------------------------+--------------------+
| [1, 2, 3, 6]             | [null, 1, 3, 4, 5]             | [null]             |
+--------------------------+--------------------------------+--------------------+
```
