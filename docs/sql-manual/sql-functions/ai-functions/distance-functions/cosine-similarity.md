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

## Syntax

```sql
COSINE_SIMILARITY(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<array1>` | The first vector. Supported array element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<array2>` | The second vector. Supported array element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |

When both arrays are non-empty, they must have the same number of elements.

## Return Value

Returns the cosine similarity between two vectors as a nullable `FLOAT`. Array inputs follow these rules:

- If either whole array is `NULL` or empty (`[]`), the result is `NULL`, including `NULL`/`NULL` and `[]`/`[]`.
- A non-empty array containing a `NULL` element raises an error. Passing `NULL` or `[]` as the other argument does not make that invalid array valid.
- Two non-empty arrays with different numbers of elements raise an error.

When both arrays are valid and non-empty, a zero vector such as `[0, 0]` still produces `0.0`; it is different from an empty array.

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
-- An empty array returns NULL
SELECT COSINE_SIMILARITY([], []);
```

```text
+---------------------------+
| COSINE_SIMILARITY([], []) |
+---------------------------+
|                      NULL |
+---------------------------+
```

```sql
-- NULL inside the input array raises an error
SELECT COSINE_SIMILARITY([1, NULL, 3], [1, 2, 3]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_similarity cannot have null
```

The following examples show empty-array and NULL input behavior:

```sql
SELECT COSINE_SIMILARITY(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       COSINE_SIMILARITY(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
