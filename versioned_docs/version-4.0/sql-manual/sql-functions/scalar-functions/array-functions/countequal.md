---
{
    "title": "COUNTEQUAL",
    "language": "en"
}
---

## Function

Count the number of elements equal to a given target value within an array.

## Syntax

- `COUNTEQUAL(arr, target)`

## Parameters

- `arr`: `ARRAY<T>`, supported element types include numeric, boolean, string, datetime, and IP.
- `target`: same type as elements of `arr`.

## Return value

- Returns `BIGINT`, representing the count of equal elements.

## Usage notes

- `NULL` equals `NULL` for this function and will be counted.

## Examples

- Basic
  - `COUNTEQUAL([1,2,3,2], 2)` -> `2`
  - `COUNTEQUAL(['a','b','a'], 'a')` -> `2`
  - `COUNTEQUAL([true,false,false], false)` -> `2`

- `NULL` is considered equal and will be counted
  - `COUNTEQUAL([1,NULL,2,NULL], NULL)` -> `2`
  - `COUNTEQUAL([1,NULL,1], 1)` -> `2`
  - `COUNTEQUAL([1, 2], NULL)` -> `0`

- If the array is `NULL`, returns `NULL`
  - `COUNTEQUAL(NULL, 1)` -> `NULL`



