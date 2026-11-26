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
| -- | -- |
| `<array1>` | The first vector. Supported array element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<array2>` | The second vector. Supported array element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |

When both arrays are non-empty, they must have the same number of elements.

## Return Value

Returns the cosine distance between two vectors as a nullable `FLOAT`. Array inputs follow these rules:

- If either whole array is `NULL` or empty (`[]`), the result is `NULL`, including `NULL`/`NULL` and `[]`/`[]`.
- A non-empty array containing a `NULL` element raises an error. Passing `NULL` or `[]` as the other argument does not make that invalid array valid.
- Two non-empty arrays with different numbers of elements raise an error.

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


If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT COSINE_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function cosine_distance cannot have null
```

The following examples show empty-array and NULL input behavior:

```sql
SELECT COSINE_DISTANCE(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       COSINE_DISTANCE(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
