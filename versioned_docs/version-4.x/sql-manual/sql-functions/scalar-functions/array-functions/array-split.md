---
{
    "title": "ARRAY_SPLIT",
    "language": "en-US"
}
---

## Function

Split the input array into multiple subarrays according to given boolean flags.

- Splitting rule (left to right): for `arr=[a1,a2,...,an]` and `flags=[f1,f2,...,fn]`, at every position where `fi==true`, split between `ai` and `a(i-1)`.
  - For example, with `arr=[3, 4, 5]` and `flags=[false, true, false]`, the second flag is true, so split between the first and second elements, resulting in two subarrays `[3]` and `[4,5]`.

## Syntax

- `ARRAY_SPLIT(arr, flags)`
- `ARRAY_SPLIT(lambda, arr0, ...)`
- `ARRAY_SPLIT(lambda, arr0, ...)` is equivalent to `ARRAY_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))`

## Parameters

- `arr`: `ARRAY<T>`.
- `flags`: `ARRAY<BOOLEAN>`, whose length must match that of `arr` row by row. `true` means split between the current position and the next element.
- `arr0, ...`: one or more `ARRAY<T>`.
- `lambda`: a `lambda` expression applied to `arr0, ...` to produce `flags`, which are then used for splitting.

## Return value

- Returns `ARRAY<ARRAY<T>>`. Elements of inner arrays are the same as those of `arr`.
- If the element counts of `arr` and `flags` do not match, an error is thrown.

## Usage notes

- If a position in `flags` is `NULL`, it is treated as no split (equivalent to `false`).
- The splitting rule of `ARRAY_SPLIT` is: at each position where `fi==true`, split between `ai` and `a(i-1)`.
- The splitting rule of `ARRAY_REVERSE_SPLIT` is: at each position where `fi==true`, split between `ai` and `a(i+1)`.

## Examples

- Basic splitting: at each `true` position, split from the left side neighbor.
  - `ARRAY_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1], [2, 3], [4, 5]]`
  - `ARRAY_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- With `NULL` in `flags`: `NULL` is treated the same as `false` (no split).
  - `ARRAY_SPLIT([1,NULL,3], [false,null,false])` -> `[[1,[NULL,3]]`

- `lambda= x -> x-1` applied to `arr0=[1, 2, 3]` produces `flags=[0,1,2]`, equivalent to `flags=[false,true,true]`
  - `ARRAY_SPLIT(x->x-1, [1, 2, 3])` is equivalent to `ARRAY_SPLIT([1, 2, 3], [false,true,true])` -> `[[1], [2], [3]]`

- `lambda= (x,y) -> x-y` applied to `arr0=[1, 2, 3]` and `arr1=[0,1,2]` produces `flags=[true,true,true]`
  - `ARRAY_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])` is equivalent to `ARRAY_SPLIT([1, 2, 3], [true,true,true])` -> `[[1], [2], [3]]`

