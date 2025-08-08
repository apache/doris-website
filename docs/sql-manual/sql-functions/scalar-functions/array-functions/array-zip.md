---
{
    "title": "ARRAY_ZIP",
    "language": "en"
}
---

## Function

The `ARRAY_ZIP` function is used to combine multiple arrays (such as `arr1, arr2, ..., arrN`) into an `ARRAY<STRUCT>` based on their element positions, where each `STRUCT` contains elements from the corresponding positions of the input arrays.

## Syntax

```SQL
ARRAY_ZIP(arr1, arr2, ..., arrN)
```

## Parameters

- `arr1, arr2, ..., arrN`: The input N arrays, of types `ARRAY<T1>, ARRAY<T2>, ..., ARRAY<Tn>`.
    - The input parameters can be constructed constants or variables.
    - If any of the arrays is NULL, the function result is NULL (see examples).

## Return Value

- The return type is `ARRAY<STRUCT<col1 T1, col2 T2, ..., colN Tn>>`, where each `STRUCT` represents the combination of elements from the input arrays at the same index position.

## Usage Notes

1. **If the lengths of the multiple arrays are inconsistent, the function execution fails and returns `RUNTIME_ERROR`**.
2. Supports input arrays of different types, with the struct fields corresponding one-to-one with the input arrays' types.
3. Can be used to combine multiple parallel arrays into a structured format for further processing or analysis.

## Examples

1. Combining multiple arrays

    ```SQL
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), ARRAY(true, false, true));
    +-------------------------------------------------------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), ARRAY(true, false, true))                              |
    +-------------------------------------------------------------------------------------------------------------------+
    | [{"col1":23, "col2":"John", "col3":1}, {"col1":24, "col2":"Jane", "col3":0}, {"col1":25, "col2":"Jim", "col3":1}] |
    +-------------------------------------------------------------------------------------------------------------------+
    ```
    - The first `STRUCT` in the return value contains the first element of each input `ARRAY`.
    - The second `STRUCT` contains the second element of each input `ARRAY`.
    - The third `STRUCT` contains the third element of each input `ARRAY`.

2. Accessing the return value

    ```SQL
    -- Accessing the returned ARRAY
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"))[1];
    +---------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"))[1] |
    +---------------------------------------------------------------+
    | {"col1":23, "col2":"John"}                                    |
    +---------------------------------------------------------------+
    ```

3. When one of the arrays is NULL

    ```SQL
    SELECT ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), NULL) ;
    +------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, 24, 25), ARRAY("John", "Jane", "Jim"), NULL) |
    +------------------------------------------------------------------+
    | NULL                                                             |
    +------------------------------------------------------------------+
    ```

4. Arrays containing NULL elements

    ```SQL
    SELECT ARRAY_ZIP(ARRAY(23, NULL, 25), ARRAY("John", "Jane", NULL), ARRAY(NULL, false, true));
    +-----------------------------------------------------------------------------------------------------------------------+
    | ARRAY_ZIP(ARRAY(23, NULL, 25), ARRAY("John", "Jane", NULL), ARRAY(NULL, false, true))                                 |
    +-----------------------------------------------------------------------------------------------------------------------+
    | [{"col1":23, "col2":"John", "col3":null}, {"col1":null, "col2":"Jane", "col3":0}, {"col1":25, "col2":null, "col3":1}] |
    +-----------------------------------------------------------------------------------------------------------------------+
    ```

