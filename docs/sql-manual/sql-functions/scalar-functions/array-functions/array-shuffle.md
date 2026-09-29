---
{
    "title": "ARRAY_SHUFFLE",
    "language": "en-US",
    "description": "Randomly shuffle the order of elements in an array."
}
---

## Function

Randomly shuffle the order of elements in an array.

## Syntax

- `ARRAY_SHUFFLE(arr)`
- `ARRAY_SHUFFLE(arr, seed)`

## Parameters

- `arr`: `ARRAY<T>`.
- `seed`: optional, random seed. It must be a constant `BIGINT`.

## Return value

- Returns an array of the same type as the input, with elements randomly reordered. Element count and types remain unchanged.

## Usage notes

- If the input `arr` is `NULL`, returns `NULL`. If `seed` is `NULL`, returns `NULL`.
- Each row is shuffled on its own, even when `arr` is a constant, so rows with the same array can get different orders.
- `seed` must be a constant, such as `0` or `1 + 1`. Passing a column or another non-constant expression reports an error.
- Any `BIGINT` value can be a `seed`, including a negative one. All 64 bits are used, so `-1` and `4294967295` give different results.
- Rows are processed in batches. Each batch starts a random sequence from `seed`, and its rows take numbers from the sequence one after another. So a single call such as `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` gives the same result each time, but on many rows, the order of a row can change with how the rows are split into batches.
- Without `seed`, each batch starts from a new random seed, so the result may differ between executions.
- `ARRAY_SHUFFLE` has an alias `SHUFFLE`; they are equivalent.

## Examples

- Basic usage:
  - `ARRAY_SHUFFLE([1, 2, 3, 4])` -> e.g. `[3, 1, 4, 2]` (random order)
  - `ARRAY_SHUFFLE(['a', null, 'b'])` -> e.g. `['b', 'a', null]`

- With a fixed seed (reproducible results):
  - `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` -> `[2, 1, 3, 4]` each time

- A constant array is shuffled on each row:
  - `SELECT number, ARRAY_SHUFFLE([1, 2, 3, 4, 5], 0) FROM numbers("number" = "3") ORDER BY number` -> `[3, 1, 2, 4, 5]`, `[3, 5, 4, 2, 1]` and `[4, 5, 1, 3, 2]` on the three rows

- A negative seed works, and all 64 bits are used:
  - `ARRAY_SHUFFLE([1, 2, 3, 4], -1)` -> `[4, 1, 3, 2]`, while `ARRAY_SHUFFLE([1, 2, 3, 4], 4294967295)` -> `[2, 4, 3, 1]`

- A non-constant seed reports an error:
  - `SELECT ARRAY_SHUFFLE(arr, id) FROM t` -> error `The seed of array_shuffle must be a constant`

