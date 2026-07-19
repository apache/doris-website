---
{
    "title": "BIT_LENGTH",
    "language": "en",
    "description": "Returns the bit length of a string or binary value (i.e., the byte length × 8)."
}
---

## Description

Returns the bit length of a string or binary value (i.e., the byte length × 8).

## Syntax
```sql
BIT_LENGTH(<str>)
```

## Parameters
- `<str>` The string value whose bit length is to be returned.

## Return Value

Returns the number of bits occupied by `<str>` in its binary representation, counting all `0` and `1` bits.

## Examples
1. Example 1
    ```sql
    select BIT_LENGTH("abc"), BIT_LENGTH("中国"), BIT_LENGTH(123);
    ```

    ```text
    +-------------------+----------------------+-----------------+
    | BIT_LENGTH("abc") | BIT_LENGTH("中国")   | BIT_LENGTH(123) |
    +-------------------+----------------------+-----------------+
    |                24 |                   48 |              24 |
    +-------------------+----------------------+-----------------+
    ```
2. NULL argument
    ```sql
    select BIT_LENGTH(NULL);
    ```
    ```text
    +------------------+
    | BIT_LENGTH(NULL) |
    +------------------+
    |             NULL |
    +------------------+
    ```
