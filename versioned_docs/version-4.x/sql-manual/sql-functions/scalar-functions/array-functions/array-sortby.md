---
{
    "title": "ARRAY_SORTBY",
    "language": "en-US"
}
---

## Function

Sort the `values` array according to the order of a `keys` array.
- For example, if `keys` is `[3, 0, 2]` and `values` is `[5, 7, 8]`, after sorting the `keys` become `[0, 2, 3]` and the corresponding `values` become `[7, 8, 5]`.

## Syntax

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)` is equivalent to `ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))`

## Parameters

- `values`: `ARRAY<T>`, the value array to be sorted. `T` supports numeric, boolean, string, datetime, IP, etc.
- `keys`: `ARRAY<T>`, a key array of the same length as `values`. `T` supports numeric, boolean, string, datetime, IP, etc.
- `lambda`: a `lambda` expression applied to `values` to produce the `keys` array used for sorting.

## Return value

- Returns `ARRAY<T>` of the same type as `values`.
- An error is thrown when, for any row, the element counts of `values` and `keys` are different.

## Usage notes

- Stability: `values` are reordered by ascending `keys`. The relative order among equal keys is undefined.
- In higher-order calls, `keys` are computed first by `ARRAY_MAP`, then `values` are sorted by `keys`.

## Examples

- Basic: sort `values` by the ascending order of `keys`.
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b]`

- Higher-order: compute `keys` via `lambda`, then sort.
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]` (with `keys` `[4,2,3]`)
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[1,2,3]` (with `keys` `[true,false,false]`)

- When `keys` or `values` is `NULL`, return `values` unchanged.
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`



