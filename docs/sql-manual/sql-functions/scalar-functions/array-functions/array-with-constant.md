---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "en"
}
---

## Function

`ARRAY_WITH_CONSTANT` is used to generate an array of a specified length where all elements are the given value.

## Syntax

```SQL
ARRAY_WITH_CONSTANT(count, element)
```

## Parameters

- `count`: An integer type that specifies the length of the returned array.
    - The range of `count` is `[0, 1000000]`; otherwise, it will return an error `INVALID_ARGUMENT`.
    - It can be a constructed constant or a variable.

- `element`: A value of any type used to fill the array.
    - It can be a constructed constant or a variable.

## Return Value

- Returns an array of type `ARRAY<T>`, where `T` is the type of `element`.
    - The array contains `count` elements, all equal to `element`.

## Usage Notes

- If `count = 0` or `NULL`, returns an empty array.
- If `element` is NULL, all elements in the array are NULL.
- The function has the same functionality as `ARRAY_REPEAT`, but with parameters in reverse order.
- It can be used in combination with other array functions to achieve more complex data construction logic.

## Examples

1. Simple example

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(3, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(3, 'hello') |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. Exceptional parameters

    ```SQL
    SELECT ARRAY_WITH_CONSTANT(0, 'hello');
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(0, 'hello') |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, 'hello');
    +------------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, 'hello') |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_WITH_CONSTANT(2, NULL);
    +------------------------------+
    | ARRAY_WITH_CONSTANT(2, NULL) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_WITH_CONSTANT(NULL, NULL);
    +---------------------------------+
    | ARRAY_WITH_CONSTANT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_WITH_CONSTANT(-1, 'hello');
    ```
