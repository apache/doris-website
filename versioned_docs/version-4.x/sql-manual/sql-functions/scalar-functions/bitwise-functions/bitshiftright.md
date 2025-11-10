---
{
"title": "BIT_SHIFT_RIGHT",
"language": "zh-CN"
}
---

## Description
Performs a right shift bitwise operation, which moves all bits of a binary number to the right by a specified number of positions. This operation is commonly used for handling binary data or for efficient mathematical calculations (such as division).

Logical right shift of -1 by one position results in BIGINT_MAX (9223372036854775807).

Right shifting a number by a negative value always results in 0.

## Syntax
```sql
BIT_SHIFT_RIGHT(<x>, <bits>)
```


## Parameters
- `<x>`: The number to be shifted.
- `<bits>`: The number of positions to shift right. It is an integer that determines how many positions `<x>` will be shifted.

## Return Value

Returns an integer representing the result after the right shift operation.

## Examples
1. Example 1
    ```sql
    select BIT_SHIFT_RIGHT(1024,3), BIT_SHIFT_RIGHT(-1,1), BIT_SHIFT_RIGHT(100, -1);
    ```
    ```text
    +-------------------------+-----------------------+--------------------------+
    | BIT_SHIFT_RIGHT(1024,3) | BIT_SHIFT_RIGHT(-1,1) | BIT_SHIFT_RIGHT(100, -1) |
    +-------------------------+-----------------------+--------------------------+
    |                     128 |   9223372036854775807 |                        0 |
    +-------------------------+-----------------------+--------------------------+
    ```
2. NULL argument
    ```sql
    select BIT_SHIFT_RIGHT(1024, NULL), BIT_SHIFT_RIGHT(NULL, 3), BIT_SHIFT_RIGHT(NULL, NULL);
    ```
    ```text
    +-----------------------------+--------------------------+-----------------------------+
    | BIT_SHIFT_RIGHT(1024, NULL) | BIT_SHIFT_RIGHT(NULL, 3) | BIT_SHIFT_RIGHT(NULL, NULL) |
    +-----------------------------+--------------------------+-----------------------------+
    |                        NULL |                     NULL |                        NULL |
    +-----------------------------+--------------------------+-----------------------------+
    ```
