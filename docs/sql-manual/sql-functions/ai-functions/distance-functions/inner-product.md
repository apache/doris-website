---
{
    "title": "INNER_PRODUCT",
    "language": "en",
    "description": "Computes the scalar product of two dense or sparse vectors"
}
---

## Description

Computes the scalar product of two dense vectors represented by arrays, or two sparse vectors represented by maps. For sparse vectors, each map key identifies a dimension and its value is the coordinate. Only dimensions present in both maps contribute to the result.

In dev, array inputs support missing vectors: a whole `NULL` array or an empty array (`[]`) produces `NULL`; see Return Value for invalid-input handling.

## Syntax

```sql
INNER_PRODUCT(<array1>, <array2>)
INNER_PRODUCT(<map1>, <map2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<array1>` | Vector 1, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<array2>` | Vector 2, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<map1>` | The first sparse vector. Its type must be `MAP<K, FLOAT>`, where `K` is an integer type (TINYINT, SMALLINT, INT, BIGINT, or LARGEINT) or a string type (CHAR, VARCHAR, or STRING). Its key type must be from the same type family as that of `<map2>`. |
| `<map2>` | The second sparse vector. It has the same type constraints as `<map1>`. The two maps can contain different numbers of entries. |

When both arrays are non-empty, they must have the same number of elements.

The MAP overload accepts `<map1>` and `<map2>` of type `MAP<K, FLOAT>`. Keys must belong to the same integer or string type family and be convertible to a common type; other numeric values can be converted to FLOAT. It computes a sparse-vector dot product over shared keys.

## Return Value

For array inputs, returns the scalar product between two vectors as a nullable `FLOAT`. In the dev version, array inputs follow these rules:

- If either whole array is `NULL` or empty (`[]`), the result is `NULL`, including `NULL`/`NULL` and `[]`/`[]`.
- A non-empty array containing a `NULL` element raises an error. Passing `NULL` or `[]` as the other argument does not make that invalid array valid.
- Two non-empty arrays with different numbers of elements raise an error.

These scalar evaluation rules do not depend on `enable_ann_index_empty_array`, which only controls whether ANN-indexed columns accept empty arrays on writes.

The MAP overload is unchanged: it returns a non-nullable `FLOAT`, with `0` for an empty MAP or no shared keys. A whole `NULL` MAP or a retained `NULL` value after key deduplication raises an error. Duplicate keys use the last value, and a `NULL` key can match a `NULL` key in the other MAP.

## Example

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

The following example computes the inner product of two sparse vectors. Only keys `a` and `b` occur in both maps, so the result is `2 * 5 + 3 * 4 = 22`:

```sql
SELECT INNER_PRODUCT(
    MAP('a', CAST(2 AS FLOAT), 'b', CAST(3 AS FLOAT)),
    MAP('b', CAST(4 AS FLOAT), 'c', CAST(100 AS FLOAT), 'a', CAST(5 AS FLOAT))
) AS result;
```

```text
+--------+
| result |
+--------+
|     22 |
+--------+
```


If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT INNER_PRODUCT([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```

If a map value is `NULL`, the function returns an error:

```sql
SELECT INNER_PRODUCT(
    MAP(1, CAST(NULL AS FLOAT)),
    MAP(1, CAST(2 AS FLOAT))
);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product cannot have null
```

The following examples need no table and show empty-array and NULL input behavior in dev:

```sql
SELECT INNER_PRODUCT(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       INNER_PRODUCT(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```

```sql
SELECT INNER_PRODUCT(MAP(1, 2.0, 2, 3.0), MAP(2, 4.0, 3, 5.0)) AS map_result,
       INNER_PRODUCT(CAST(MAP() AS MAP<INT, FLOAT>), MAP(1, 2.0)) AS empty_map_result;
```

```text
+------------+------------------+
| map_result | empty_map_result |
+------------+------------------+
|         12 |                0 |
+------------+------------------+
```
