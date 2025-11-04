---
{
    "title": "NULLIF",
    "language": "en"
}
---

## Description

If the two input values are equal, returns `NULL`; otherwise, returns the first input value. This function is equivalent to the following `CASE WHEN` expression:

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```

## Syntax

```sql
NULLIF(<expr1>, <expr2>)
```

## Parameters
- `<expr1>`: The first input value to be compared. See usage notes below for supported types.
- `<expr2>`: The second value to be compared with the first input value. See usage notes below for supported types.

## Usage Notes
Supported types for parameters:
1. Boolean
2. Numeric types (TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal)
3. Date types (Date, DateTime, Time)
4. String types (String, VARCHAR, CHAR)

## Return Value
- If `<expr1>` equals `<expr2>`, returns `NULL`.
- Otherwise, returns the value of `<expr1>`.

## Examples
1. Example 1
    ```sql
    SELECT NULLIF(1, 1);
    ```
    ```text
    +--------------+
    | NULLIF(1, 1) |
    +--------------+
    |         NULL |
    +--------------+
    ```
2. Example 2
    ```sql
    SELECT NULLIF(1, 0);
    ```
    ```text
    +--------------+
    | NULLIF(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```