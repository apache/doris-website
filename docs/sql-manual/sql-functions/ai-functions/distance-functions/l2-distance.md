---
{
    "title": "L2_DISTANCE",
    "language": "en",
    "description": "Calculate the distance between two points (vector values are coordinates) in Euclidean space"
}
---

## Description

Calculate the distance between two points (vector values are coordinates) in Euclidean space

## Syntax

```sql
L2_DISTANCE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- |--|
| `<array1>` | The first vector (the vector value is the coordinate),The subtypes of the input array are: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, The number of elements must be consistent with array2 |
| `<array2>` | The second vector (the vector value is the coordinate), the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1 |

## Return Value

Returns the distance between two points (vector values are coordinates) in Euclidean space. The return type is `FLOAT`.

If either input array is `NULL`, or contains a `NULL` element, the function returns an error.

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

If an input array is `NULL`, the function returns an error:

```sql
SELECT L2_DISTANCE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot be null
```

If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT L2_DISTANCE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance cannot have null
```
