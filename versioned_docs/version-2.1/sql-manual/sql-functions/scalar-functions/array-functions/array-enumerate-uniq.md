---
{
    "title": "ARRAY_ENUMERATE_UNIQ",
    "language": "en",
    "description": "Returns an array the same size as the source array, indicating for each element what its position is among elements with the same value. For example,"
}
---

## Description
Returns an array the same size as the source array, indicating for each element what its position is among elements with the same value. For example, array_enumerate_uniq([1, 2, 1, 4]) = [1, 1, 2, 1].
The array_enumerate_uniq function can take multiple arrays of the same size as arguments. In this case, uniqueness is considered for tuples of elements in the same positions in all the arrays. For example, array_enumerate_uniq([1, 2, 1, 1, 2], [2, 1, 2, 2, 1]) = [1, 1, 2, 3, 2].

## Syntax
```sql
ARRAY_ENUMERATE_UNIQ(<arr1> [,<arr2> , ... ])
```
## Parameters
| Parameter | Description |
|---|---|
| `<arr1>` | Needed be computed array arr1  |
| `<arr2>` | Needed be computed array arr2  |

## Return Value
Returns an array the same size as the source array, indicating for each element what its position is among elements with the same value.

## Example

```sql
select array_enumerate_uniq([1, 2, 3, 1, 2, 3]);
```
```text
+-----------------------------------------------------+
| array_enumerate_uniq(ARRAY(1, 2, 3, 1, 2, 3))       |
+-----------------------------------------------------+
| [1, 1, 1, 2, 2, 2]                                  |
+-----------------------------------------------------+
```
```sql
select array_enumerate_uniq([1, 1, 1, 1, 1], [2, 1, 2, 1, 2], [3, 1, 3, 1, 3]);
```
```text
+----------------------------------------------------------------------------------------+
| array_enumerate_uniq(ARRAY(1, 1, 1, 1, 1), ARRAY(2, 1, 2, 1, 2), ARRAY(3, 1, 3, 1, 3)) |
+----------------------------------------------------------------------------------------+
| [1, 1, 2, 1, 3]                                                                        |
+----------------------------------------------------------------------------------------+
```