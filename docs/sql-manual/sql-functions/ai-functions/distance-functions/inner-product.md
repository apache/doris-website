---
{
    "title": "INNER_PRODUCT",
    "language": "en",
    "description": "Computes the scalar product of two dense or sparse vectors"
}
---

## Description

Computes the scalar product of two dense vectors represented by arrays, or two sparse vectors represented by maps. For sparse vectors, each map key identifies a dimension and its value is the coordinate. Only dimensions present in both maps contribute to the result.

## Syntax

```sql
INNER_PRODUCT(<array1>, <array2>)
INNER_PRODUCT(<map1>, <map2>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<array1>` | The first dense vector. Supported element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The number of elements must equal that of `<array2>`. |
| `<array2>` | The second dense vector. Supported element types are TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, and DOUBLE. The number of elements must equal that of `<array1>`. |
| `<map1>` | The first sparse vector. Its type must be `MAP<K, FLOAT>`, where `K` is an integer type (TINYINT, SMALLINT, INT, BIGINT, or LARGEINT) or a string type (CHAR, VARCHAR, or STRING). Its key type must be from the same type family as that of `<map2>`. |
| `<map2>` | The second sparse vector. It has the same type constraints as `<map1>`. The two maps can contain different numbers of entries. |

## Return Value

Returns the scalar product as a `FLOAT`.

For array inputs, corresponding elements are multiplied and summed. If either array is `NULL`, contains a `NULL` element, or the arrays have different lengths, the function returns an error.

For map inputs, values with the same key are multiplied and summed. A key that occurs in only one map has no effect, which is equivalent to treating the missing coordinate as zero. `NULL` keys match other `NULL` keys. If a key occurs more than once, its last value is used. If either map is `NULL`, or the value retained for any key is `NULL`, the function returns an error.

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
