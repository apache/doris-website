---
{
    "title": "HAMMING_DISTANCE_APPROXIMATE",
    "language": "en",
    "description": "Calculates Hamming distance between two byte vectors: the number of differing bits after bitwise XOR. NULL arrays or NULL elements raise an error."
}
---

## Description

Calculates Hamming distance between two byte vectors: the number of differing bits after bitwise XOR. NULL arrays or NULL elements raise an error.

Available in Doris 4.2 builds that include this function.Eligible Lance Top-N queries can use native approximate retrieval; other queries execute scalar kernels.

## Syntax

```sql
HAMMING_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<array1>` | Integer array of TINYINT, SMALLINT, INT, or BIGINT, coerced to ARRAY<BIGINT>. Every element must be in `[0,255]`; floating-point, decimal, and LARGEINT arrays are rejected. |
| `<array2>` | Integer array of TINYINT, SMALLINT, INT, or BIGINT, coerced to ARRAY<BIGINT>. Every element must be in `[0,255]`; floating-point, decimal, and LARGEINT arrays are rejected. The two arrays must have the same length. |

## Return Value

Returns FLOAT; smaller means closer. Two empty arrays return 0; N-byte vectors have a maximum distance of 8N.Unequal lengths, NULL arrays, or NULL elements raise an error rather than return NULL.Out-of-range elements also raise an error.Native candidate eligibility, numerical precision, and NULL/NaN behavior can differ from scalar execution; see [automatic search](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search).

## Example

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot be null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot have null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
