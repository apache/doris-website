---
{
    "title": "ARRAY_SUM",
    "language": "en"
}
---

### Function

The `ARRAY_SUM` function calculates the sum of all numeric elements in an array.

## Syntax

```SQL
ARRAY_SUM(ARRAY<T>)
```

## Parameters

`ARRAY<T>`: An array containing **numeric type** elements.

## Return Value

- Returns the sum of all non-`NULL` elements in the array.

    - If all elements are `NULL`, returns `NULL`.

## Usage Notes

1. Summation of elements uses the `+` operator.

2. Elements that are `NULL` are automatically ignored.

3. If the array contains non-numeric type elements (such as strings), it will result in a runtime error.

## Examples

1. Simple example

    ```SQL
    SELECT ARRAY_SUM([1, 2, 3, 4]);
    +-------------------------+
    | ARRAY_SUM([1, 2, 3, 4]) |
    +-------------------------+
    |                      10 |
    +-------------------------+
    ```

2. Handling `NULL` values in arrays

    ```SQL
    SELECT ARRAY_SUM([1, NULL, 3]); 
    +-------------------------+
    | ARRAY_SUM([1, NULL, 3]) |
    +-------------------------+
    |                       4 |
    +-------------------------+

    SELECT ARRAY_SUM(NULL);
    +-----------------+
    | ARRAY_SUM(NULL) |
    +-----------------+
    |            NULL |
    +-----------------+

    SELECT ARRAY_SUM([NULL, NULL]); 
    +-------------------------+
    | ARRAY_SUM([NULL, NULL]) |
    +-------------------------+
    |                    NULL |
    +-------------------------+
    ```
