---
{
    "title": "NOT_NULL_OR_EMPTY",
    "language": "en",
    "description": "The notnullorempty function is used to determine whether the given value is not NULL and not empty. If the input value is neither NULL nor empty,"
}
---

## Description

The `not_null_or_empty` function is used to determine whether the given value is not NULL and not empty. If the input value is neither NULL nor empty, it returns true; otherwise, it returns false.

## Syntax

```sql
NOT_NULL_OR_EMPTY (<str>)
```

## Parameters
- `<str>`: String type, the string to be checked for NULL or empty.

## Return Value
Returns false if the string is an empty string or NULL; otherwise, returns true.

## Examples
1. Example 1
    ```sql
    select not_null_or_empty(null), not_null_or_empty("");, not_null_or_empty(" ");
    ```
    ```text
    +-------------------------+-----------------------+------------------------+
    | not_null_or_empty(null) | not_null_or_empty("") | not_null_or_empty(" ") |
    +-------------------------+-----------------------+------------------------+
    |                       0 |                     0 |                      1 |
    +-------------------------+-----------------------+------------------------+
    ```
