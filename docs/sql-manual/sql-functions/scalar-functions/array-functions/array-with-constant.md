---
{
    "title": "ARRAY_WITH_CONSTANT",
    "language": "en-US"
}
---

## Function

`ARRAY_WITH_CONSTANT` is used to generate an array of a specified length, where all elements have the given value.

## Syntax

```SQL
ARRAY_WITH_CONSTANT(count, element)
```

## Parameters

- `count`: Integer type, specifies the length of the returned array.

- `element`: Any storage type supported in an `ARRAY`.

## Return Value

- Returns an array of type `ARRAY<T>`, where `T` is the type of `element`.
    - The array contains `count` copies of the same `element`.

## Usage Notes

- If `count = 0` or `NULL`, returns an empty array.
- If `element` is `NULL`, all elements in the array are `NULL`.
- This function has the same functionality as `ARRAY_REPEAT`, but the parameter order is reversed.
- Can be combined with other array functions to construct more complex data.

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

2. Special cases
   
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
