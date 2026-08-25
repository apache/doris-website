---
{
    "title": "MAP_FROM_ARRAYS",
    "language": "en",
    "description": "Constructs a MAP from a key array and a value array"
}
---

## Description

Constructs a `MAP<K, V>` from a key array and a value array. Elements at the same position form a key-value pair.

## Syntax

```sql
MAP_FROM_ARRAYS(<keys>, <values>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<keys>` | An `ARRAY<K>`. `K` must be a type supported by MAP keys. The array and its elements can be `NULL`. |
| `<values>` | An `ARRAY<V>`. The array and its elements can be `NULL`. When both arrays are non-`NULL`, it must have the same number of elements as `<keys>`. |

## Return Value

Returns a `MAP<K, V>`.

- If either input array is `NULL`, returns `NULL`.
- `NULL` elements are retained as `NULL` keys or values in the result.
- If both arrays are non-`NULL` but have different lengths, an error is reported. The length of the other array is not checked when either array is `NULL`.
- If a key occurs more than once, the value from the last occurrence is retained.
- If an argument is not an array, or `K` is not a type supported by MAP keys, an analysis error is reported.

## Examples

```sql
SELECT map_from_arrays([1, 2], [10, 20]) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_arrays([1, 1], [10, 20]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]);
```

```text
+-------------------------------------------------+
| map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

```sql
SELECT map_from_arrays(
    array(CAST(NULL AS INT), 2),
    array(10, CAST(NULL AS INT))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

```sql
SELECT map_from_arrays([1, 2], [10]);
```

```text
ERROR 1105 (HY000): The key and value array offsets of function map_from_arrays must be identical
```
