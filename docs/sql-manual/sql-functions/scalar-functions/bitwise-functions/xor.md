---
{
    "title": "XOR",
    "language": "zh-CN"
}
---

## Description
Performs a bitwise XOR operation on two BOOLEAN values.

## Syntax
```sql
<lhs> XOR <rhs>
```

## Parameters
- `<lhs>`: The first BOOLEAN value for the bitwise XOR operation.
- `<rhs>`: The second BOOLEAN value for the bitwise XOR operation.

## Return Value
Returns the XOR value of the two BOOLEAN values.

## Examples
1. Example 1
    ```sql
    select true XOR false, true XOR true;
    ```
    ```text
    +----------------+---------------+
    | true XOR false | true XOR true |
    +----------------+---------------+
    |              1 |             0 |
    +----------------+---------------+
    ```
2. NULL argument
    ```sql
    select true XOR NULL, NULL XOR true, false XOR NULL, NULL XOR false, NULL XOR NULL;
    ```
    ```text
    +---------------+---------------+----------------+----------------+---------------+
    | true XOR NULL | NULL XOR true | false XOR NULL | NULL XOR false | NULL XOR NULL |
    +---------------+---------------+----------------+----------------+---------------+
    |          NULL |          NULL |           NULL |           NULL |          NULL |
    +---------------+---------------+----------------+----------------+---------------+
    ```
