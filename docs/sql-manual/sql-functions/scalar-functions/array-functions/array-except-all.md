---
{
    "title": "ARRAY_EXCEPT_ALL",
    "language": "en",
    "description": "Returns the multiset difference of two arrays, preserving unmatched duplicates and the order of the first array."
}
---

## array_except_all

<version since="dev">

</version>

## Description

Returns the multiset difference of `arr1` and `arr2`. Each occurrence in `arr2` removes at most one equal occurrence from `arr1`; remaining elements, including duplicates, keep their original order. `NULL` elements are compared and removed by occurrence, while a `NULL` input array produces a `NULL` result.

## Syntax

```sql
ARRAY_EXCEPT_ALL(<arr1>, <arr2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<arr1>` | The first array. Its element type must be a supported scalar type and must be compatible with the element type of `<arr2>`. |
| `<arr2>` | The second array. Each occurrence removes one matching occurrence from `<arr1>`. Its element type must be a supported scalar type and must be compatible with `<arr1>`. |

Supported scalar element types include numeric, boolean, string, date/time, and IPv4/IPv6 types. Complex element types such as `ARRAY`, `MAP`, `STRUCT`, `JSON`, and `VARIANT` are not supported.

## Return Value

Returns an `ARRAY<T>` containing the remaining elements from `<arr1>` in their original order. If either input array is `NULL`, returns `NULL`. If no elements remain, returns an empty array.

## Example

Basic multiset difference:

```sql
SELECT array_except_all([1, 1, 2, 3], [1, 3]);
```

```text
[1, 2]
```

Occurrences are removed one at a time, so unmatched duplicates are preserved:

```sql
SELECT array_except_all(['a', 'a', 'b'], ['a']);
```

```text
["a", "b"]
```

The result keeps the order of the first array:

```sql
SELECT array_except_all([3, 1, 3, 2], [3]);
```

```text
[1, 3, 2]
```

`NULL` elements participate in multiset subtraction:

```sql
SELECT array_except_all(['a', NULL, 'a', NULL], [NULL]);
```

```text
["a", "a", null]
```

If either input array is `NULL`, the result is `NULL`:

```sql
SELECT array_except_all(CAST(NULL AS ARRAY<INT>), [1]);
```

```text
NULL
```

An empty second array leaves the first array unchanged:

```sql
SELECT array_except_all([1, 1, 2], CAST([] AS ARRAY<INT>));
```

```text
[1, 1, 2]
```

Unlike `array_except`, this function preserves remaining duplicates:

```sql
SELECT array_except([1, 1, 2], [1]), array_except_all([1, 1, 2], [1]);
```

```text
[2]    [1, 2]
```

Complex element types are not supported:

```sql
SELECT array_except_all([[1], [2]], [[1]]);
```

```text
ERROR 1105 (HY000): array_except_all does not support types
```

### Keywords

ARRAY, EXCEPT, MULTISET, ARRAY_EXCEPT_ALL
