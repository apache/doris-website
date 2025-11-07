---
{
    "title": "ARRAY_PRODUCT",
    "language": "en"
}
---

## Description

Calculates the product of all elements in an array

## Syntax

```sql
ARRAY_PRODUCT(<arr>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | Corresponding array |

## Return Value

Returns the product of all elements in the array. NULL values in the array will be skipped. For an empty array or an array with all NULL values, the result returns a NULL value.

## Example

```sql
SELECT ARRAY_PRODUCT([1, 2, 3]),ARRAY_PRODUCT([1, NULL, 3]),ARRAY_PRODUCT([NULL]);
```

```text
+--------------------------+-----------------------------+----------------------------------------------+
| array_product([1, 2, 3]) | array_product([1, NULL, 3]) | array_product(cast([NULL] as ARRAY<DOUBLE>)) |
+--------------------------+-----------------------------+----------------------------------------------+
|                        6 |                           3 |                                         NULL |
+--------------------------+-----------------------------+----------------------------------------------+
```
