---
{
    "title": "HAMMING_DISTANCE",
    "language": "en",
    "description": "Calculates Hamming distance between two byte vectors: the number of differing bits after bitwise XOR. NULL arrays or NULL elements raise an error."
}
---

## Description

Calculates Hamming distance between two byte vectors: the number of differing bits after bitwise XOR. NULL arrays or NULL elements raise an error.

Available in Doris 4.2 builds that include this function.Always uses exact scalar evaluation; it is not automatically substituted with ANN search.

## Syntax

```sql
HAMMING_DISTANCE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<array1>` | Integer array of TINYINT, SMALLINT, INT, or BIGINT, coerced to ARRAY<BIGINT>. Every element must be in `[0,255]`; floating-point, decimal, and LARGEINT arrays are rejected. |
| `<array2>` | Integer array of TINYINT, SMALLINT, INT, or BIGINT, coerced to ARRAY<BIGINT>. Every element must be in `[0,255]`; floating-point, decimal, and LARGEINT arrays are rejected. The two arrays must have the same length. |

## Return Value

Returns FLOAT; smaller means closer. Two empty arrays return 0; N-byte vectors have a maximum distance of 8N.Unequal lengths, NULL arrays, or NULL elements raise an error rather than return NULL.Out-of-range elements also raise an error.

## Example

```sql
SELECT HAMMING_DISTANCE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot be null
```

```sql
SELECT HAMMING_DISTANCE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance cannot have null
```

```sql
SELECT HAMMING_DISTANCE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
