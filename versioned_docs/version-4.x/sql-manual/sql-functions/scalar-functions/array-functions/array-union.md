---
{
    "title": "ARRAY_UNION",
    "language": "en"
}
---

## Function

`ARRAY_UNION` returns the union of multiple arrays, i.e., merges all elements from the arrays, removes duplicates, and returns a new array.

## Syntax

```SQL
ARRAY_UNION(arr1, arr2, ..., arrN)
```

## Parameters

- `arr1, arr2, ..., arrN`: Any number of array inputs, all of type `ARRAY<T>`.
    - The element type `T` of all arrays must be the same, or implicitly convertible to a unified type.
    - The element type `T` can be numeric, string, date/time, or IP type.
  
## Return Value

- Returns a new array of type `ARRAY<T>` containing all unique elements from the input arrays (duplicates removed).
    - If any input parameter is `NULL`, returns `NULL` (see example).

## Usage Notes

1. Duplicate removal is based on equality comparison (`=` operator).
2. Only one `NULL` will be kept in the result array (see example).
3. If the input array itself contains multiple identical elements, only one will be kept (see example).
4. The order of elements in the result array is not guaranteed.

## Examples

1. Simple example

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

2. If any input array is `NULL`, returns `NULL`
   
    ```SQL
    SELECT ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world'), NULL); 
    +---------------------------------------------------------------------+
    | ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', 'world'), NULL) |
    +---------------------------------------------------------------------+
    | NULL                                                                |
    +---------------------------------------------------------------------+
    ```

3. If input arrays contain `NULL`, the output array will contain only one `NULL`

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

4. If an array contains duplicate elements, only one will be returned

    ```SQL
    SELECT ARRAY_UNION(ARRAY('hello', 'world', 'hello'), ARRAY('hello', NULL)); 
    +------------------------------------------------------------+
    | ARRAY_UNION(ARRAY('hello', 'world'), ARRAY('hello', NULL)) |
    +------------------------------------------------------------+
    | [null, "world", "hello"]                                   |
    +------------------------------------------------------------+
    ```
