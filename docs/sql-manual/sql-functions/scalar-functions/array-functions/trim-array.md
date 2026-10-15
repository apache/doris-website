---
{
    "title": "TRIM_ARRAY Function",
    "language": "en-US",
    "description": "TRIM_ARRAY removes a specified number of trailing elements from an array while preserving the order and type of the remaining elements."
}
---

## trim_array

<version since="dev">

</version>

## Description

Removes `<size>` elements from the end of `<arr>` while preserving the order of the remaining elements.

## Syntax

```sql
TRIM_ARRAY(<arr>, <size>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<arr>` | The input `ARRAY<T>`. `T` can be a numeric, boolean, string, date/time, IP, or complex type. |
| `<size>` | A non-negative `BIGINT` specifying how many elements to remove from the end. It cannot exceed the cardinality of `<arr>`. |

## Return Value

Returns an `ARRAY<T>` containing the first `cardinality(<arr>) - <size>` elements of `<arr>`.

- If `<size>` is `0`, returns the input array unchanged.
- If `<size>` equals the array cardinality, returns an empty array.
- If either argument is `NULL`, returns `NULL`.
- `NULL` elements inside the array are preserved.
- If `<size>` is negative or exceeds the array cardinality, returns an error.

## Examples

Remove two elements from the end:

```sql
SELECT trim_array([1, 2, 3, 4], 2);
```

```text
[1, 2]
```

A size of zero leaves the array unchanged:

```sql
SELECT trim_array(['a', 'b', 'c'], 0);
```

```text
["a", "b", "c"]
```

Remove all elements:

```sql
SELECT trim_array([1, 2, 3], 3);
```

```text
[]
```

`NULL` elements and nested arrays are supported:

```sql
SELECT trim_array([[1, NULL], [2, 3], [4, 5]], 1);
```

```text
[[1, null], [2, 3]]
```

A `NULL` argument produces `NULL`:

```sql
SELECT trim_array(CAST(NULL AS ARRAY<INT>), 0);
```

```text
NULL
```

A size larger than the array cardinality produces an error:

```sql
SELECT trim_array([1, 2, 3], 4);
```

```text
ERROR 1105 (HY000): size must not exceed array cardinality 3: 4
```

### Keywords

ARRAY, TRIM, TRIM_ARRAY
