---
{
    "title": "ARRAY_REPEAT",
    "language": "en"
}
---

## Function

`ARRAY_REPEAT` is used to generate an array of a specified length, where all elements have the given value.

## Syntax

```SQL
ARRAY_REPEAT(element, count)
```

## Parameters

- `element`: Any storage type supported in an `ARRAY`.

- `count`: Integer type, specifies the length of the returned array.


## Return Value

- Returns an array of type `ARRAY<T>`, where `T` is the type of `element`.
    - The array contains `count` copies of the same `element`.

## Usage Notes

- If `count = 0` or `NULL`, returns an empty array.
- If `element` is `NULL`, all elements in the array are `NULL`.
- This function has the same functionality as `ARRAY_WITH_CONSTANT`, but the parameter order is reversed.

## Examples

1. Simple example

    ```SQL
    SELECT ARRAY_REPEAT('hello', 3);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 3) |
    +---------------------------------+
    | ["hello", "hello", "hello"]     |
    +---------------------------------+
    ```

2. Special cases
   
    ```SQL
    SELECT ARRAY_REPEAT('hello', 0);
    +---------------------------------+
    | ARRAY_REPEAT('hello', 0) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    SELECT ARRAY_REPEAT('hello', NULL);
    +------------------------------------+
    | ARRAY_REPEAT('hello', NULL) |
    +------------------------------------+
    | []                                 |
    +------------------------------------+

    SELECT ARRAY_REPEAT(NULL, 2);
    +------------------------------+
    | ARRAY_REPEAT(NULL, 2) |
    +------------------------------+
    | [null, null]                 |
    +------------------------------+

    SELECT ARRAY_REPEAT(NULL, NULL);
    +---------------------------------+
    | ARRAY_REPEAT(NULL, NULL) |
    +---------------------------------+
    | []                              |
    +---------------------------------+

    -- Returns error: INVALID_ARGUMENT
    SELECT ARRAY_REPEAT('hello', -1);
    ```
