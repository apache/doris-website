---
{
    "title": "ARRAY_SLICE",
    "language": "en-US"
}
---

## Function

Return a subarray, supporting starting offset and length.

## Syntax

- `ARRAY_SLICE(arr, offset)`
- `ARRAY_SLICE(arr, offset, length)`

## Parameters

- `arr`: `ARRAY<T>`.
- `offset`: starting position. Positive values count from the head (`1` is the first element); negative values count from the tail (`-1` is the last element).
- `length`: length to take. A positive value takes `length` elements; a negative value is treated as length 0.

## Return value

- Returns `ARRAY<T>` of the same type as the input.

## Usage notes

- Out-of-bounds safe: the start and end are clipped to the array boundaries. If there is no overlap, an empty array is returned.

## Examples

- Positive starting offset: from the offset to the right end
  - `ARRAY_SLICE([1,2,3,4,5,6], 2)` -> `[2,3,4,5,6]`

- Negative starting offset: from the offset to the right end
  - `ARRAY_SLICE([1,2,3,4,5,6], -3)` -> `[4,5,6]`

- Positive length: take to the right starting from offset
  - `ARRAY_SLICE([1,2,3,4,5,6], 2, 3)` -> `[2,3,4]`
  - `ARRAY_SLICE([1,2,3,4,5,6], -4, 2)` -> `[3,4]`

- Negative length: treated as length 0
  - `ARRAY_SLICE([1,2,3,4,5,6], 2, -2)` -> `[]`

- Out-of-range arguments: return empty array
  - `ARRAY_SLICE([1,2,3,4,5,6], 10, 3)` -> `[]`

- Any `NULL` argument: return `NULL`
  - `ARRAY_SLICE([1,2,3], NULL, 2)` -> `NULL`
  - `ARRAY_SLICE([1,2,3], 2, NULL)` -> `NULL`
  - `ARRAY_SLICE(NULL, 2, 3)` -> `NULL`



