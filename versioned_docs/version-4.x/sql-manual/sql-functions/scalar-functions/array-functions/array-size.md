---
{
    "title": "ARRAY_SIZE",
    "language": "en-US"
}
---

## Function

Return the number of elements in an array.

## Syntax

- `ARRAY_SIZE(arr)`

## Parameters

- `arr`: `ARRAY<T>`.

## Return value

- Returns how many elements `arr` contains.

## Usage notes

- If the input `arr` is `NULL`, returns `NULL`.

## Examples

- Arrays:
  - `ARRAY_SIZE([1, 2, 3])` -> `3`
  - `ARRAY_SIZE(['a', NULL, 'b'])` -> `3`

- If the input `arr` is `NULL`, returns `NULL`
  - `ARRAY_SIZE(NULL)` -> `NULL`

