---
{
    "title": "BIT_LENGTH",
    "language": "zh-CN",
    "description": "Returns the length of a string or binary value in bits."
}
---

## Description

Returns the length of a string or binary value in bits.

## Syntax
```sql
BIT_LENGTH( <str>)
```

## Parameters
- `<str>` The string value for which the length is returned.

## Return Value

Returns the number of bits occupied by `<str>` in the binary representation, including all 0 and 1.

## Examples
1. 示例 1
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
2. NULL 参数
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