---
{
"title": "BITNOT",
"language": "en"
}
---

## Description
Performs a bitwise NOT operation on an integer.

Supported integer types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT.

## Syntax
```sql
BITNOT(<x>)
```

## Parameters
- `<x>`: The integer to perform the operation on.

## Return Value
Returns the result of the bitwise NOT operation on the integer.

## Examples
1. Example 1
    ```sql
    select BITNOT(7), BITNOT(-127);
    ```
    ```text
    +-----------+--------------+
    | BITNOT(7) | BITNOT(-127) |
    +-----------+--------------+
    |        -8 |          126 |
    +-----------+--------------+
    ```
2. NULL argument
    ```sql
    select BITNOT(NULL);
    ```
    ```text
    +--------------+
    | BITNOT(NULL) |
    +--------------+
    |         NULL |
    +--------------+
    ```