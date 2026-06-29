---
{
    "title": "COSINE_SIMILARITY",
    "language": "en",
    "description": "Calculates the cosine similarity between two vectors."
}
---

## Description

Calculates the cosine similarity between two vectors.
The similarity is computed from the dot product and vector norms, and the result is in `[-1, 1]`.

:::note Version Note
This function is supported since 4.1.2.
:::

## Syntax

```sql
COSINE_SIMILARITY(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|---|--|
| `<array1>` | The first vector. The input type must be `ARRAY<FLOAT>`. |
| `<array2>` | The second vector. The input type must be `ARRAY<FLOAT>`, and the number of elements must be the same as `<array1>`. |

## Return Value

Returns the cosine similarity between two vectors, in FLOAT type.
If the input array is `NULL`, or any element in the array is `NULL`, an error is returned.
If the two arrays have different numbers of elements, an error is returned.
If the array is empty, or either vector is a zero vector, `0.0` is returned.

## Example

```sql
-- Two identical vectors have similarity 1
SELECT COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([1, 2, 3], [1, 2, 3]) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

`[1, 2, 3]` and `[1, 2, 3]` point in the same direction, so the similarity is `1`.

```sql
-- Orthogonal vectors have similarity 0
SELECT COSINE_SIMILARITY([1, 0], [0, 1]);
```

```text
+-----------------------------------+
| COSINE_SIMILARITY([1, 0], [0, 1]) |
+-----------------------------------+
|                                 0 |
+-----------------------------------+
```

The vectors are orthogonal, so their dot product is `0` and the similarity is `0`.

```sql
-- A zero vector returns 0
SELECT COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]);
```

```text
+-----------------------------------------+
| COSINE_SIMILARITY([0, 0, 0], [1, 2, 3]) |
+-----------------------------------------+
|                                       0 |
+-----------------------------------------+
```

A zero vector has no valid direction, so the result is `0`.

```sql
-- An empty array returns 0
SELECT COSINE_SIMILARITY([], []);
```

```text
+---------------------------+
| COSINE_SIMILARITY([], []) |
+---------------------------+
|                         0 |
+---------------------------+
```

```sql
-- NULL inside the input array raises an error
SELECT COSINE_SIMILARITY([1, NULL, 3], [1, 2, 3]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_similarity cannot have null
```

