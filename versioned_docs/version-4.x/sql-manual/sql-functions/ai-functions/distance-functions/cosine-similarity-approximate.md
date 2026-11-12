---
{
    "title": "COSINE_SIMILARITY_APPROXIMATE",
    "language": "en",
    "description": "Calculates cosine similarity between two vectors. NULL arrays or NULL elements raise an error."
}
---

## Description

Calculates cosine similarity between two vectors. NULL arrays or NULL elements raise an error.

Available in Doris 4.2 builds that include this function.Eligible Lance Top-N queries can use native approximate retrieval; other queries execute scalar kernels.

## Syntax

```sql
COSINE_SIMILARITY_APPROXIMATE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<array1>` | Numeric array, implicitly converted to ARRAY<FLOAT>; conversion can affect precision. |
| `<array2>` | Numeric array, implicitly converted to ARRAY<FLOAT>; conversion can affect precision. The two arrays must have the same length. |

## Return Value

Returns FLOAT; larger means more similar. Scalar evaluation computes `dot(x,y) / (norm(x) * norm(y))`. If either norm is zero, including two empty arrays, it returns 0.Unequal lengths, NULL arrays, or NULL elements raise an error rather than return NULL.Native candidate eligibility, numerical precision, and NULL/NaN behavior can differ from scalar execution; see [automatic search](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search).

## Example

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot be null
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot have null
```
