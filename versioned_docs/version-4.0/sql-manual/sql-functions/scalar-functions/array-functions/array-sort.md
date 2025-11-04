---
{
    "title": "ARRAY_SORT",
    "language": "en-US"
}
---

## Function

Sort array elements in ascending order.

## Syntax

- `ARRAY_SORT(arr)`

## Parameters

- `arr`: `ARRAY<T>`, where `T` can be numeric, boolean, string, datetime, IP, etc.

## Return value

- Returns `ARRAY<T>` of the same type as the input.
- `NULL` elements are placed at the beginning of the returned array.

## Usage notes

- If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
- `ARRAY_SORT` sorts in ascending order, while `ARRAY_REVERSE_SORT` sorts in descending order.

## Examples

- Basic: `NULL` elements are placed at the beginning of the returned array
  - `ARRAY_SORT([2,1,3,null])` -> `[null, 1, 2, 3]`

- If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
  - `ARRAY_SORT(NULL)` -> `NULL`
  - `ARRAY_SORT([])` -> `[]`



