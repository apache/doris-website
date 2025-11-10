---
{
    "title": "ARRAY_SORT",
    "language": "en-US"
}
---

## Function

If no lambda function is specified, the array elements are sorted in ascending order. Otherwise, sorting is performed according to the lambda function.

## Syntax

- `ARRAY_SORT(arr)`
- `ARRAY_SORT(lambda, arr)`

## Parameters

- `lambda`: A `lambda` expression used to define sorting rules, whose return value should be -1, 0, or 1 (representing less than, less than or equal to, and greater than respectively).
- `arr`: `ARRAY<T>`, where `T` can be numeric, boolean, string, datetime, IP, etc.

## Return value

- If it does not contain a `lambda` expression
  - Returns `ARRAY<T>` of the same type as the input.
  - `NULL` elements are placed at the beginning of the returned array.
- If it contains a `lambda` expression, sort according to the lambda expression and return an `ARRAY<T>` of the same type as the input.

## Usage notes

- If it does not contain a `lambda` expression
  - If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
  - `ARRAY_SORT` sorts in ascending order, while `ARRAY_REVERSE_SORT` sorts in descending order.
- If containing a `lambda` expression
  - The value of the `lambda` expression shall be -1, 0, or 1. Should a `NULL` value exist, it shall be explicitly stated whether the `NULL` value is to be placed before or after the array.

## Examples

- Basic: `NULL` elements are placed at the beginning of the returned array
  - `ARRAY_SORT([2,1,3,null])` -> `[null, 1, 2, 3]`

- If the input is `NULL`, returns `NULL`; if the input is an empty array `[]`, returns an empty array.
  - `ARRAY_SORT(NULL)` -> `NULL`
  - `ARRAY_SORT([])` -> `[]`

- Use `lambda` expressions

```sql
SELECT array_sort((x, y) -> IF(x < y, 1, IF(x = y, 0, -1)), [3, 2, 5, 1, 2]);
-- [5, 3, 2, 2, 1]

SELECT array_sort((x, y) -> IF(x < y, 1, IF(x = y, 0, -1)), ['bc', 'ab', 'dc']);
-- ["dc", "bc", "ab"]

SELECT array_sort((x, y) -> CASE WHEN x IS NULL THEN -1
                              WHEN y IS NULL THEN 1
                              WHEN x < y THEN 1
                              WHEN x = y THEN 0
                              ELSE -1 END,
                              [3, 2, null, 5, null, 1, 2]);
-- [null, null, 5, 3, 2, 2, 1]

SELECT array_sort((x, y) -> CASE WHEN x IS NULL THEN 1
                              WHEN y IS NULL THEN -1
                              WHEN x < y THEN 1
                              WHEN x = y THEN 0
                              ELSE -1 END,
                              [3, 2, null, 5, null, 1, 2]);
-- [5, 3, 2, 2, 1, null, null] 

SELECT array_sort((x, y) -> IF(length(x) < length(y), -1,
                            IF(length(x) = length(y), 0, 1)),
                            ['a', 'abcd', 'abc']);
-- ["a", "abc", "abcd"] 

SELECT array_sort((x, y) -> IF(cardinality(x) < cardinality(y), -1,
                            IF(cardinality(x) = cardinality(y), 0, 1)),
                            [[2, 3, 1], [4, 2, 1, 4], [1, 2]]);
-- [[1, 2], [2, 3, 1], [4, 2, 1, 4]]
```
