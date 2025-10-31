---
{
    "title": "ARRAY_REMOVE",
    "language": "en"
}
---

## Function

Remove all elements equal to the given value from an array while preserving the relative order of the remaining elements.

## Syntax

- `ARRAY_REMOVE(arr, target)`

## Parameters

- `arr`: `ARRAY<T>`, supports numbers, boolean, string, datetime, IP, etc.
- `target`: a value of the same type as the array elements, used to match elements to remove.

## Return value

- Returns `ARRAY<T>` of the same type as the input.
- If `arr` is `NULL`, returns `NULL`.

## Usage notes

- Matching rule: only elements whose value equals `target` are removed. `NULL` is equal to `NULL`.

## Examples

- Basic: After removal, the remaining elements keep their original relative order.
  - `ARRAY_REMOVE([1,2,3], 1)` -> `[2,3]`
  - `ARRAY_REMOVE([1,2,3,null], 1)` -> `[2,3,null]`

- If `target` is `NULL`, remove `NULL` in `arr`.
  - `ARRAY_REMOVE(['a','b','c',NULL], NULL)` -> `NULL`

- If `arr` is `NULL`, returns `NULL`
  - `ARRAY_REMOVE(NULL, 2)` -> `NULL`

- No match
  - `ARRAY_REMOVE([1,2,3], 258)` -> `[1,2,3]`



