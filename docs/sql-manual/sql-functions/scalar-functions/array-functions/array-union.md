---
{
    "title": "ARRAY_UNION",
    "language": "en"
}
---

## Function

`ARRAY_UNION` is used to return the union of multiple arrays, that is, to merge all elements that appear in the arrays and form a new array after deduplication.

## Syntax

```SQL
ARRAY_UNION(arr1, arr2, ..., arrN)
```

## Parameters

- `arr1, arr2, ..., arrN`: Any number of array inputs, all of type `ARRAY<T>`.
    - The element types `T` of all arrays must be the same, or can be implicitly converted to a unified type.
    - The type `T` does not support semi-structured types.
    - Parameters can be constants or variables.

## Return Value

- Returns a new array of type `ARRAY<T>`, containing all unique elements from the input arrays, i.e., the deduplicated union.
    - If any parameter is `NULL`, returns `NULL` (see examples).

## Usage Notes

1. Deduplication of elements relies on equality comparison (using the = operator).
2. Only one `NULL` is retained in the array result (see examples).
3. The order of the array result is indeterminate.

## Examples

1. Simple examples

    ```SQL
    SELECT ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world')); 
    +---------------------------------------------------------------+
    | ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world')) |
    +---------------------------------------------------------------+
    | ["world", "hello"]                                            |
    +---------------------------------------------------------------+

    SELECT ARRAY_UNION(ARRAY(1, 2, 3), ARRAY(3, 5, 6));
    +---------------------------------------------+
    | ARRAY_UNION(ARRAY(1, 2, 3), ARRAY(3, 5, 6)) |
    +---------------------------------------------+
    | [1, 5, 2, 6, 3]                             |
    +---------------------------------------------+
    ```

2. When the input array is `NULL`

    ```SQL
    SELECT ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world'), NULL); 
    +---------------------------------------------------------------------+
    | ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world'), NULL) |
    +---------------------------------------------------------------------+
    | NULL                                                                |
    +---------------------------------------------------------------------+
    ```

3. When the input array contains `NULL`

    ```SQL
    SELECT ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', NULL)); 
    +------------------------------------------------------------+
    | ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', NULL)) |
    +------------------------------------------------------------+
    | [null, "world", "hello"]                                   |
    +------------------------------------------------------------+

    SELECT ARRAY_UNION(ARRAY(NULL, 'world'), ARRAY('hello', NULL)); 
    +---------------------------------------------------------+
    | ARRAY_UNION(ARRAY(NULL, 'world'), ARRAY('hello', NULL)) |
    +---------------------------------------------------------+
    | [null, "world", "hello"]                                |
    +---------------------------------------------------------+
    ```
