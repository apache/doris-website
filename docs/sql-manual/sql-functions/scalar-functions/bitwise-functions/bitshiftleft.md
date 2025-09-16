---
{
"title": "BIT_SHIFT_LEFT",
"language": "en"
}
---

## Description
Performs a left shift operation, which moves all bits of a binary number to the left by a specified number of positions. This is a form of bitwise operation, commonly used for handling binary data or efficient mathematical calculations.

For the maximum value of BIGINT type (9223372036854775807), shifting left by one position results in -2.
## Syntax
```sql
BIT_SHIFT_LEFT(<x>, <bits>)
```

## Parameters
- `<x>`: The number to be shifted.
- `<bits>`: The number of positions to shift left. It is an integer that determines how many positions `<x>` will be shifted.

## Return Value
Returns an integer representing the result after the left shift operation.

## Examples
1. Example 1
    ```sql
    select BIT_SHIFT_LEFT(5, 2), BIT_SHIFT_LEFT(-5, 2), BIT_SHIFT_LEFT(9223372036854775807, 1);
    ```

    ```text
    +----------------------+-----------------------+----------------------------------------+
    | BIT_SHIFT_LEFT(5, 2) | BIT_SHIFT_LEFT(-5, 2) | BIT_SHIFT_LEFT(9223372036854775807, 1) |
    +----------------------+-----------------------+----------------------------------------+
    |                   20 |                   -20 |                                     -2 |
    +----------------------+-----------------------+----------------------------------------+
    ```
2. NULL argument
    ```sql
    select BIT_SHIFT_LEFT(5, NULL), BIT_SHIFT_LEFT(NULL, 2), BIT_SHIFT_LEFT(NULL, NULL);
    ```
    ```text
    +-------------------------+-------------------------+----------------------------+
    | BIT_SHIFT_LEFT(5, NULL) | BIT_SHIFT_LEFT(NULL, 2) | BIT_SHIFT_LEFT(NULL, NULL) |
    +-------------------------+-------------------------+----------------------------+
    |                    NULL |                    NULL |                       NULL |
    +-------------------------+-------------------------+----------------------------+
    ```