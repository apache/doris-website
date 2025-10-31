---
{
    "title": "ARRAY_SHUFFLE",
    "language": "en-US"
}
---

## Function

Randomly shuffle the order of elements in an array.

## Syntax

- `ARRAY_SHUFFLE(arr)`
- `ARRAY_SHUFFLE(arr, seed)`

## Parameters

- `arr`: `ARRAY<T>`.
- `seed`: optional, random seed.

## Return value

- Returns an array of the same type as the input, with elements randomly reordered. Element count and types remain unchanged.

## Usage notes

- If the input `arr` is `NULL`, returns `NULL`.
- Providing a `seed` yields reproducible results; omitting it may yield different results per execution.
- `ARRAY_SHUFFLE` has an alias `SHUFFLE`; they are equivalent.
- 

## Examples

- Basic usage:
  - `ARRAY_SHUFFLE([1, 2, 3, 4])` -> e.g. `[3, 1, 4, 2]` (random order)
  - `ARRAY_SHUFFLE(['a', null, 'b'])` -> e.g. `['b', 'a', null]`

- With a fixed seed (reproducible results):
  - `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` -> same order each time (e.g. `[1, 3, 2, 4]`)

