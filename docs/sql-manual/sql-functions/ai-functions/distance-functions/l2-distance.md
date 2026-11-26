---
{
    "title": "L2_DISTANCE",
    "language": "en",
    "description": "Calculate the distance between two points (vector values are coordinates) in Euclidean space"
}
---

## Description

Calculate the distance between two points (vector values are coordinates) in Euclidean space

In dev, array inputs support missing vectors: a whole `NULL` array or an empty array (`[]`) produces `NULL`; see Return Value for invalid-input handling.

## Syntax

```sql
L2_DISTANCE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<array1>` | Vector 1, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<array2>` | Vector 2, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |

When both arrays are non-empty, they must have the same number of elements.

## Return Value

Returns the Euclidean distance between two vectors as a nullable `FLOAT`. In the dev version, array inputs follow these rules:

- If either whole array is `NULL` or empty (`[]`), the result is `NULL`, including `NULL`/`NULL` and `[]`/`[]`.
- A non-empty array containing a `NULL` element raises an error. Passing `NULL` or `[]` as the other argument does not make that invalid array valid.
- Two non-empty arrays with different numbers of elements raise an error.

These scalar evaluation rules do not depend on `enable_ann_index_empty_array`, which only controls whether ANN-indexed columns accept empty arrays on writes.

## Example

```sql
SELECT L2_DISTANCE([4, 5], [6, 8]),L2_DISTANCE([3, 6], [4, 5]);
```

```text
+-----------------------------+-----------------------------+
| l2_distance([4, 5], [6, 8]) | l2_distance([3, 6], [4, 5]) |
+-----------------------------+-----------------------------+
|                    3.605551 |                    1.414214 |
+-----------------------------+-----------------------------+
```


If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT L2_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot have null
```

The following examples need no table and show empty-array and NULL input behavior in dev:

```sql
SELECT L2_DISTANCE(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       L2_DISTANCE(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
