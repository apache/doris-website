---
{
    "title": "COSINE_DISTANCE",
    "language": "en",
    "description": "Calculates the cosine distance between two vectors (vector values are coordinates)"
}
---

## Description

Calculates the cosine distance between two vectors (vector values are coordinates)

## Syntax

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|---|--|
| `<array1>` | The first vector (the vector value is the coordinate). The subtypes of the input array are: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE. The number of elements must be consistent with array2 |
| `<array2>` | The second vector (the vector value is the coordinate), the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1 |

## Return Value

Returns the cosine distance between two vectors (where the vector values are coordinates). The return type is `FLOAT`.

If either input array is `NULL`, or contains a `NULL` element, the function returns an error.

## Example

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|                     0.007722139 |                     0.001539648 |
+---------------------------------+---------------------------------+
```

If an input array is `NULL`, the function returns an error:

```sql
SELECT COSINE_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot be null
```

If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```
