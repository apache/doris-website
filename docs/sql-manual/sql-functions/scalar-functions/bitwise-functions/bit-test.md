---
{
    "title": "BIT_TEST",
    "language": "en",
    "description": "Converts the value of <x> to its binary form and returns the value at the specified <bits> position(s), where <bits> starts from 0 (rightmost bit)."
}
---

## Description
Converts the value of `<x>` to its binary form and returns the value at the specified `<bits>` position(s), where `<bits>` starts from 0 (rightmost bit).

If `<bits>` contains multiple values, the values at these positions are combined using the AND operator, and the final result is returned.

If any value in `<bits>` is negative or exceeds the total number of bits in `<x>`, the result is 0.

Supported integer types for `<x>`: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## Alias
- BIT_TEST_ALL

## Syntax
```sql
BIT_TEST(<x>, <bits>[, <bits> ... ])
```

## Parameters
- `<x>`
- `<bits>`

## Return Value

Returns the value at the specified position(s).

## Examples
1. Example 1
    ```sql
    select BIT_TEST(43, 1), BIT_TEST(43, -1), BIT_TEST(43, 2), BIT_TEST(43, 0, 1, 3, 5), BIT_TEST(43, 0, 1, 3, 5, 2);
    ```
    ```text
    +-----------------+------------------+-----------------+--------------------------+-----------------------------+
    | BIT_TEST(43, 1) | BIT_TEST(43, -1) | BIT_TEST(43, 2) | BIT_TEST(43, 0, 1, 3, 5) | BIT_TEST(43, 0, 1, 3, 5, 2) |
    +-----------------+------------------+-----------------+--------------------------+-----------------------------+
    |               1 |                0 |               0 |                        1 |                           0 |
    +-----------------+------------------+-----------------+--------------------------+-----------------------------+
    ```
    > The binary representation of 43 is "101011", so `BIT_TEST(43, 1)` returns 1, `BIT_TEST(43, 2)` returns 0, and `BIT_TEST(43, 0, 1, 3, 5)` returns 1.
    > `BIT_TEST(43, 0, 1, 3, 5, 2)` returns 0.
2. NULL argument
    ```sql
    select BIT_TEST(NULL, 1), BIT_TEST(43, NULL), BIT_TEST(NULL, NULL);
    ```
    ```text
    +-------------------+--------------------+----------------------+
    | BIT_TEST(NULL, 1) | BIT_TEST(43, NULL) | BIT_TEST(NULL, NULL) |
    +-------------------+--------------------+----------------------+
    |              NULL |               NULL |                 NULL |
    +-------------------+--------------------+----------------------+
    ```