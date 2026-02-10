---
{
    "title": "ARRAY_ZIP",
    "language": "en",
    "description": "The ARRAYZIP function combines multiple ARRAYs (e.g., arr1, arr2, ... , arrN) element-wise into a single ARRAY<STRUCT>,"
}
---

## Function

The `ARRAY_ZIP` function combines multiple `ARRAY`s (e.g., `arr1, arr2, ... , arrN`) element-wise into a single `ARRAY<STRUCT>`, where each `STRUCT` contains the corresponding elements from each input array.

## Syntax

```SQL
ARRAY_ZIP(arr1, arr2, ... , arrN)
```

## Parameters

- `arr1, arr2, ..., arrN`: The N input arrays, with types `ARRAY<T1>, ARRAY<T2>, ..., ARRAY<Tn>`.

## Return Value

- The return type is `ARRAY<STRUCT<col1 T1, col2 T2, ..., colN Tn>>`, where each `STRUCT` represents the combination of elements at the same index from the input arrays.

## Usage Notes

1. **If the arrays have different lengths, the function fails with `RUNTIME_ERROR`**.
2. Supports input arrays of different types; the resulting struct fields correspond one-to-one with the input array types.
3. Useful for combining multiple parallel arrays into a structured format for easier processing or analysis.

## Examples

1. Combine multiple arrays

    ```SQL
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), ARRAY(true, false, true));
    +-------------------------------------------------------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), ARRAY(true, false, true))                              |
    +-------------------------------------------------------------------------------------------------------------------+
    | [{"col1":23, "col2":"John", "col3":1}, {"col1":24, "col2":"Jane", "col3":0}, {"col1":25, "col2":"Jim", "col3":1}] |
    +-------------------------------------------------------------------------------------------------------------------+
    ```
    - The first `STRUCT` in the return value contains the first element from each input `ARRAY`.
    - The second `STRUCT` contains the second element from each input `ARRAY`.
    - The third `STRUCT` contains the third element from each input `ARRAY`.

2. Access the return value
   
    ```SQL
    -- Access the returned ARRAY
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"))[1];
    +---------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"))[1] |
    +---------------------------------------------------------------+
    | {"col1":23, "col2":"John"}                                    |
    +---------------------------------------------------------------+
    ```

3. If one of the arrays is `NULL`, returns `NULL`

    ```SQL
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), NULL) ;
    +------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), NULL) |
    +------------------------------------------------------------------+
    | NULL                                                             |
    +------------------------------------------------------------------+
    ```

4. If an element in an `ARRAY` is `NULL`, the corresponding field in the `STRUCT` is `NULL`
   
    ```SQL
     SELECT ARRAY_ZIP(ARRAY(23, NULL, 25), ARRAY("John", "Jane", NULL), ARRAY(NULL, false, true));
    +-----------------------------------------------------------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, NULL, 25), ARRAY("John", "Jane", NULL), ARRAY(NULL, false, true))                                 |
    +-----------------------------------------------------------------------------------------------------------------------+
    | [{"col1":23, "col2":"John", "col3":null}, {"col1":null, "col2":"Jane", "col3":0}, {"col1":25, "col2":null, "col3":1}] |
    +-----------------------------------------------------------------------------------------------------------------------+
    ```
