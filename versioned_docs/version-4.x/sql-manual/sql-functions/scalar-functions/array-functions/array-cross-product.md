---
{
    "title": "CROSS_PRODUCT",
    "language": "en"
}
---

## Description

Computes the cross product of two arrays of size 3.

## Syntax

```sql
CROSS_PRODUCT(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- |--|
| `<array1>` | The first vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array2. Neither the array itself nor any of its elements can be NULL.|
| `<array1>` | The second vector, the subtype of the input array supports: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, the number of elements must be consistent with array1. Neither the array itself nor any of its elements can be NULL.|

## Return Value

Returns the cross product of two arrays of size 3.

## Examples

```sql
SELECT CROSS_PRODUCT([1, 2, 3], [2, 3, 4]), CROSS_PRODUCT([1, 0, 0], [0, 1, 0]);
```

```text
+-------------------------------------+-------------------------------------+
| CROSS_PRODUCT([1, 2, 3], [2, 3, 4]) | CROSS_PRODUCT([1, 0, 0], [0, 1, 0]) |
+-------------------------------------+-------------------------------------+
| [-1, 2, -1]                         | [0, 0, 1]                           |
+-------------------------------------+-------------------------------------+
```

