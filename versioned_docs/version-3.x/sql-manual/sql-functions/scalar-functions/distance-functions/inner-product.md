---
{
    "title": "INNER_PRODUCT",
    "language": "en",
    "description": "Computes the scalar product of two vectors of the same size"
}
---

## Description

Computes the scalar product of two vectors of the same size

## Syntax

```sql
INNER_PRODUCT(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- |--|
| `<array1>` | The first vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array2 |
| `<array2>` | The second vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1 |

## Return Value

Returns the scalar product of two vectors of the same size. If the input array is NULL, or any element in array is NULL, then NULL is returned.

## Examples

```sql
SELECT INNER_PRODUCT([1, 2], [2, 3]),INNER_PRODUCT([3, 6], [4, 7]);
```

```text
+-------------------------------+-------------------------------+
| inner_product([1, 2], [2, 3]) | inner_product([3, 6], [4, 7]) |
+-------------------------------+-------------------------------+
|                             8 |                            54 |
+-------------------------------+-------------------------------+
```
