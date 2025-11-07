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

Returns the judgment result: 1: left and right arrays have common elements; 0: left and right arrays do not have common elements; NULL: left or right array is NULL; or any element in left and right array is NULL

## Example

```sql
SELECT ARRAYS_OVERLAP(['a', 'b', 'c'], [1, 2, 'b']);
```

```text
+--------------------------------------------------+
| arrays_overlap(['a', 'b', 'c'], ['1', '2', 'b']) |
+--------------------------------------------------+
|                                                1 |
+--------------------------------------------------+
```
