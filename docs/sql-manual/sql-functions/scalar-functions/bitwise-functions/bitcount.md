---
{
"title": "BIT_COUNT",
"language": "en"
}
---

## Description

Returns the number of 1 bits in the binary representation of an integer value. This function can be used to quickly count the "active" bits in the binary representation of an integer, which is often useful for analyzing data distribution or performing certain bitwise operations.

## Syntax
```sql
BIT_COUNT(<x>)
```

## Parameters
- `<x>`: The integer whose binary representation will be counted for 1 bits. Supported types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## Return Value

Returns the number of 1 bits in the binary representation of `<x>`.

## Examples
1. Example 1
    ```sql
    select BIT_COUNT(0), BIT_COUNT(8), BIT_COUNT(-1);
    ```
    ```text
    +--------------+--------------+---------------+
    | BIT_COUNT(0) | BIT_COUNT(8) | BIT_COUNT(-1) |
    +--------------+--------------+---------------+
    |            0 |            1 |             8 |
    +--------------+--------------+---------------+
    ```
2. NULL argument
    ```sql
    select BIT_COUNT(NULL);
    ```
    ```text
    +-----------------+
    | BIT_COUNT(NULL) |
    +-----------------+
    |            NULL |
    +-----------------+
    ```