---
{
    "title": "IFNULL",
    "language": "en"
}
---

## Description

If the value of `<expr1>` is not `NULL`, returns `<expr1>`; otherwise, returns `<expr2>`.

## Alias

- NVL

## Syntax

```sql
IFNULL(<expr1>, <expr2>)
```

## Parameters
- `<expr1>`: The expression to be checked for `NULL`.
- `<expr2>`: The value to return if `<expr1>` is `NULL`.

## Return Value
- If `<expr1>` is not `NULL`, returns `<expr1>`.
- Otherwise, returns `<expr2>`.

## Examples
1. Example 1
    ```sql
    SELECT IFNULL(1, 0);
    ```
    ```text
    +--------------+
    | IFNULL(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
2. Example 2
    ```sql
    SELECT IFNULL(NULL, 10);
    ```
    ```text
    +------------------+
    | IFNULL(NULL, 10) |
    +------------------+
    |               10 |
    +------------------+
    ```
3. Both arguments are NULL
    ```sql
    SELECT IFNULL(NULL, NULL);
    ```
    ```text
    +--------------------+
    | IFNULL(NULL, NULL) |
    +--------------------+
    |               NULL |
    +--------------------+
    ```