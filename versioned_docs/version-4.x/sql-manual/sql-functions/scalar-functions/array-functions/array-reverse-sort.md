---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "en-US",
    "description": "Sort array elements in descending order."
}
---

## Function

Sort array elements in descending order.

## Syntax

- `ARRAY_REVERSE_SORT(arr)`

## Parameters

- `arr`: `ARRAY<T>`, where `T` can be numeric, boolean, string, datetime, IP, etc.

## Return value

- Returns `ARRAY<T>` of the same type as the input.
- `NULL` elements are placed at the end of the returned array.

## Usage notes

- If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
- `ARRAY_REVERSE_SORT` sorts in descending order, while `ARRAY_SORT` sorts in ascending order.

## Examples

- Basic: `NULL` elements are placed at the end of the returned array
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`



