---
{
    "title": "GREATEST",
    "language": "en",
    "description": "Compares multiple expressions and returns the largest value among them. If any argument is NULL, returns NULL."
}
---

## Description

Compares multiple expressions and returns the largest value among them. If any argument is `NULL`, returns `NULL`.

## Syntax

```sql
GREATEST(<expr> [, ...])
```

## Parameters
### Required Parameter
- `<expr>`: Supports `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `STRING`, `DATETIME`, and `DECIMAL` types.
### Optional Parameters
- Supports multiple arguments.

## Return Value
- Returns the largest value among the given expressions.
- If any argument is `NULL`, returns `NULL`.

## Usage Notes
1. It is recommended to pass arguments of the same type. If argument types differ, the function will attempt to convert them to the same type. For conversion rules, refer to: [Type Conversion](../../../basic-element/sql-data-types/conversion/overview.md)
2. If any argument is NULL, the result will be NULL.

## Examples
1. Example 1
    ```sql
    SELECT GREATEST(-1, 0, 5, 8);
    ```
    ```text
    +-----------------------+
    | GREATEST(-1, 0, 5, 8) |
    +-----------------------+
    |                     8 |
    +-----------------------+
    ```
2. NULL argument
    ```sql
    SELECT GREATEST(-1, 0, 5, NULL);
    ```
    ```text
    +--------------------------+
    | GREATEST(-1, 0, 5, NULL) |
    +--------------------------+
    | NULL                     |
    +--------------------------+
    ```
3. Type conversion
    ```sql
    SELECT GREATEST(6, 4.29, 7);
    ```
    ```text
    +----------------------+
    | GREATEST(6, 4.29, 7) |
    +----------------------+
    |                 7.00 |
    +----------------------+
    ```
    > The third argument "7" is converted to Decimal type.
4. Date type
    ```sql
    SELECT GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11');
    ```
    ```text
    +-------------------------------------------------------------------------------+
    | GREATEST('2022-02-26 20:02:11', '2020-01-23 20:02:11', '2020-06-22 20:02:11') |
    +-------------------------------------------------------------------------------+
    | 2022-02-26 20:02:11                                                           |
    +-------------------------------------------------------------------------------+
    ```