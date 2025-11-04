---
{
    "title": "NULL_OR_EMPTY",
    "language": "en"
}
---

## Description

The `null_or_empty` function is used to determine whether the given value is not NULL and not empty. If the input value is neither NULL nor empty, it returns true; otherwise, it returns false.

## Syntax

```sql
NULL_OR_EMPTY (<str>)
```

## Parameters
- `<str>`: String type, the string to be checked for NULL or empty.

## Return Value
Returns true if the string is an empty string or NULL; otherwise, returns false.

## Examples
1. Example 1
    ```sql
    select null_or_empty(null), null_or_empty("");, null_or_empty(" ");
    ```
    ```text
    +---------------------+-------------------+--------------------+
    | null_or_empty(null) | null_or_empty("") | null_or_empty(" ") |
    +---------------------+-------------------+--------------------+
    |                   1 |                 1 |                  0 |
    +---------------------+-------------------+--------------------+
    ```
