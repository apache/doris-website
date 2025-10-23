---
{
"title": "BITOR",
"language": "en"
}
---

## Description
Performs a bitwise OR operation on two integers.

Supported integer types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITOR(<lhs>, <rhs>)
```

## Parameters
- `<lhs>`: The first integer for the operation.
- `<rhs>`: The second integer for the operation.

## Return Value

Returns the result of the bitwise OR operation between the two integers.

## Examples
1. Example 1
    ```sql
    select BITOR(3,5), BITOR(4,7);
    ```
    ```text
    +------------+------------+
    | BITOR(3,5) | BITOR(4,7) |
    +------------+------------+
    |          7 |          7 |
    +------------+------------+
    ```
2. NULL argument
    ```sql
    select BITOR(3, NULL), BITOR(NULL, 5), BITOR(NULL, NULL);
    ```
    ```text
    +----------------+----------------+-------------------+
    | BITOR(3, NULL) | BITOR(NULL, 5) | BITOR(NULL, NULL) |
    +----------------+----------------+-------------------+
    |           NULL |           NULL |              NULL |
    +----------------+----------------+-------------------+
    ```