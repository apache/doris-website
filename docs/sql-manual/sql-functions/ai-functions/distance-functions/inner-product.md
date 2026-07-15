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

Returns the scalar product of two vectors of the same size. The return type is `FLOAT`.

If either input array is `NULL`, or contains a `NULL` element, the function returns an error.

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

If an input array is `NULL`, the function returns an error:

```sql
SELECT INNER_PRODUCT(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot be null
```

If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```
