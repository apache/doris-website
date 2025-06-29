---
{
    "title": "ARRAYS_OVERLAP",
    "language": "en"
}
---

## Description

Determine whether the left and right arrays contain common elements

## Syntax

```sql
ARRAYS_OVERLAP(<left>, <right>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<left>` | The array to be judged |
| `<right>` | The array to be judged |

## Return Value

Returns if left and right have any non-null elements in common. Returns null if there are no non-null elements in common but either array contains null.

## Example

```
select arrays_overlap([1, 2, 3], [1, null]);
+--------------------------------------+
| arrays_overlap([1, 2, 3], [1, null]) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+


select arrays_overlap([2, 3], [1, null]);
+-----------------------------------+
| arrays_overlap([2, 3], [1, null]) |
+-----------------------------------+
|                              NULL |
+-----------------------------------+

select arrays_overlap([2, 3], [1]);
+-----------------------------+
+-----------------------------+
| arrays_overlap([2, 3], [1]) |
+-----------------------------+
|                           0 |
+-----------------------------+
```
