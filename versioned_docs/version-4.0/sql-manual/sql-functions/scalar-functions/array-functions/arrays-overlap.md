---
{
    "title": "ARRAYS_OVERLAP",
    "language": "en"
}
---

## Function

`ARRAYS_OVERLAP` is used to ◊ whether two arrays have at least one common element. Returns `true` if they do, otherwise returns `false`.

## Syntax

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## Parameters

- `arr1`: The first array, type `ARRAY<T>`.

- `arr2`: The second array, type `ARRAY<T>`.

    - The element type `T` of both arrays must be the same or implicitly convertible to each other.
    - The element type `T` can be numeric, string, date/time, or IP type.

## Return Value

- Returns `BOOLEAN` type:

    - If the two arrays have an intersection, returns `true`;
    - If they have no intersection, returns `false`.

## Usage Notes

1. **Comparison is done using element equality (`=` operator)**.
2. **`NULL` and `NULL` are considered equal in this function** (see example).
3. You can specify **an inverted index in the table creation statement to accelerate execution** (see example).
   - When the function is used as a predicate condition, the inverted index will speed up execution.
   - When the function is used in the query result, the inverted index will not speed up execution.
4. Commonly used in data cleaning, tag matching, and user behavior intersection scenarios.

## Examples

1. Simple Example

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

2. Invalid parameter type: when unsupported types are passed in, returns `INVALID_ARGUMENT`

    ```SQL
    -- [INVALID_ARGUMENT] execute failed, unsupported types for function arrays_overlap
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ```

3. If the input `ARRAY` is `NULL`, the return value is `NULL`

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
    |                        NULL |
    +----------------------------+
    ```

4. When the input `ARRAY` contains `NULL`, `NULL` and `NULL` are considered equal
   
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
    |                                                             0  |
    +----------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL));
    +---------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------+
    |                                                 1 |
    +---------------------------------------------------+
    ```

5. Using inverted index to accelerate query
   
    ```SQL
    -- Create table with inverted index
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED -- only non-tokenized inverted indexes are allowed
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- Insert two rows
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```

 - When the function is used as a predicate condition, the inverted index will accelerate execution
  
    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')); 
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+

- When the function is used in the query result, the inverted index will not accelerate execution
  
    ```SQL
    SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+
    ```


