---
{
    "title": "COALESCE",
    "language": "en"
}
---

## Description

Returns the first non-null expression from the argument list, evaluated from left to right. If all arguments are NULL, returns NULL.

## Syntax

```sql
COALESCE( <expr1> [ , ... , <exprN> ] )
```

## Parameters
### Required Parameter
- `<expr1>`: An expression of any type.
### Variadic Parameters
- The `COALESCE` function supports multiple variadic parameters.

## Return Value
Returns the first non-null expression in the argument list. If all arguments are NULL, returns NULL.

## Usage Notes
1. The types of multiple arguments should be as consistent as possible.
2. If the types of multiple arguments are inconsistent, the function will attempt to convert them to the same type. For conversion rules, refer to: [Type Conversion](../../../basic-element/sql-data-types/conversion/overview.md)
3. Currently, only the following types are supported as arguments:
    * String types (String/VARCHAR/CHAR)
    * Boolean type (Boolean)
    * Numeric types (TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal)
    * Date types (Date, DateTime)
    * Bitmap type (Bitmap)
    * Semi-structured types (JSON, Array, MAP, Struct)

## Examples
1. Argument type conversion
    ```sql
    select coalesce(null, 2, 1.234);
    ```
    ```text
    +--------------------------+
    | coalesce(null, 2, 1.234) |
    +--------------------------+
    |                    2.000 |
    +--------------------------+
    ```
    > Since the third argument "1.234" is of Decimal type, the argument "2" is converted to Decimal type.

2. All arguments are NULL
    ```sql
    select coalesce(null, null, null);
    ```
    ```text
    +----------------------------+
    | coalesce(null, null, null) |
    +----------------------------+
    | NULL                       |
    +----------------------------+
    ```
