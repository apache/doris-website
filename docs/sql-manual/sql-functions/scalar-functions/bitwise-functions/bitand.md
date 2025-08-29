---
{
"title": "BITAND",
"language": "en"
}
---

## Description
Performs a bitwise AND operation. The bitwise AND operation compares each bit of two integers; the result is 1 only if both corresponding bits are 1, otherwise it is 0.

Supported integer types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT

## Syntax
```sql
BITAND(<lhs>, <rhs>)
```

## Parameters
- `<lhs>`: The first integer for the bitwise AND operation.
- `<rhs>`: The second integer for the bitwise AND operation.

## Return Value
Returns the result of the bitwise AND operation between the two integers.


## Examples
1. Example 1
    ```sql
    select BITAND(3,5), BITAND(5, 10), BITAND(7, 10);
    ```
    ```text
    +-------------+---------------+---------------+
    | BITAND(3,5) | BITAND(5, 10) | BITAND(7, 10) |
    +-------------+---------------+---------------+
    |           1 |             0 |             2 |
    +-------------+---------------+---------------+
    ```
2. NULL argument
    ```sql
    select BITAND(1, null), BITAND(null, 1), BITAND(null, null);
    ```
    ```text
    +-----------------+-----------------+--------------------+
    | BITAND(1, null) | BITAND(null, 1) | BITAND(null, null) |
    +-----------------+-----------------+--------------------+
    |            NULL |            NULL |               NULL |
    +-----------------+-----------------+--------------------+
    ```