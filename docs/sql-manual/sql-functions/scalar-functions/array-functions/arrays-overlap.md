---
{
    "title": "ARRAYS_OVERLAP",
    "language": "en"
}
---

## Function

`ARRAYS_OVERLAP` is used to determine whether two arrays have at least one identical non-null element. If they do, it returns `true`; otherwise, it returns `false`.

## Syntax

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## Parameters

- `arr1`: The first array, of type `ARRAY<T>`.
- `arr2`: The second array, of type `ARRAY<T>`.
    - The element types `T` of both arrays must be the same or implicitly convertible.
    - The element type `T` cannot be a semi-structured type.
    - Parameters can be constructed constants or variables.

## Return Value

- Returns a `BOOLEAN` type:
    - Returns `true` if the two arrays have at least one common non-null element.
    - Returns `false` if there are no common non-null elements.
    - Returns `NULL` if either `arr1` or `arr2` is `NULL`.
    - Returns `NULL` if there are no common non-null elements but at least one of the arrays contains `NULL`.

## Usage Notes

1. The comparison uses element equality (using the = operator).
2. If there are no identical non-null elements and the arrays contain `NULL`, the return value is `NULL` (see examples).
3. You can specify inverted indexes in the table creation statement to accelerate the function's execution (see examples).
   - When the function is used as a predicate in a query, the inverted index accelerates the function's execution.
   - When the function is used in the query result, the inverted index does not accelerate the function's execution.
4. Commonly used in scenarios such as data cleaning, tag matching, user behavior intersection judgment, etc.

## Examples

1. Simple example:

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey'));
    +----------------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey')) |
    +----------------------------------------------------------------------+
    |                                                                    1 |
    +----------------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey'));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey')) |
    +----------------------------------------------------------------+
    |                                                              0 |
    +----------------------------------------------------------------+
    ```

2. Invalid parameters:

    ```SQL
    -- [INVALID_ARGUMENT]execute failed, unsupported types for function arrays_overlap
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ```

3. NULL input arrays:

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL);
    +-----------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL) |
    +-----------------------------------------------+
    |                                          NULL |
    +-----------------------------------------------+

    SELECT ARRAYS_OVERLAP(NULL, NULL);
    +----------------------------+
    | ARRAYS_OVERLAP(NULL, NULL) |
    +----------------------------+
    |                       NULL |
    +----------------------------+
    ```

4. Arrays with NULL elements:

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL));
    +---------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------------------+
    |                                                             1 |
    +---------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +----------------------------------------------------------------+
    |                                                           NULL |
    +----------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL));
    +---------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------+
    |                                              NULL |
    +---------------------------------------------------+
    ```

5. Using inverted indexes:

    ```SQL
    -- Create table with inverted index
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED -- Only allows non-tokenized inverted index
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- Insert two rows
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```

    - When used as a predicate:

    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE'));
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+
    ```

    - When used in the result:

    ```SQL
    SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+
    ```

