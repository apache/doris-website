---
{
    "title": "ARRAY_SHUFFLE",
    "language": "en",
    "description": "Randomly shuffle the order of elements in an array."
}
---

<a id="function"></a>

## Description

Randomly shuffles the order of elements in an array, preserving the elements and their count. Returns NULL if the input array or seed is NULL. `SHUFFLE` is an alias for this function.

:::caution Behavior change (4.1.5)

In the Doris 4.1 series since 4.1.5, `seed` must be a constant. It accepts any BIGINT value, including negative values, and uses all 64 bits. Constant arrays are also shuffled separately for each row, so the same seed may produce a different result from earlier versions. Earlier 4.1 versions used only the seed of the first row in each batch, rejected negative seeds and seeds greater than 4294967295, and produced the same order on every row for constant arrays.

:::

## Syntax

```sql
ARRAY_SHUFFLE(<arr> [, <seed>])
```

## Parameters

| Parameter | Description |
| --- | --- |
| `<arr>` | ARRAY to shuffle. |
| `<seed>` | Optional constant BIGINT random seed. Constant expressions are supported. If omitted, each batch uses a new random seed. |

## Return Value

Returns an array of the same type as the input, with elements randomly reordered. Element count and types are preserved. Returns NULL if the array or seed is NULL, and returns an empty array for an empty input array.

<a id="usage-notes"></a>

Rows are processed in batches. With a specified seed, each batch starts a random sequence from that seed, and its rows use that sequence in order. A row's permutation can therefore depend on batch boundaries. Specifying a seed does not guarantee identical permutations for identical arrays. Constant arrays are also shuffled separately for each row.

<a id="examples"></a>

## Example

Sorting the shuffled array verifies that its elements are preserved. Both negative seeds and constant expressions are valid:

```sql
SELECT ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], -1)),
       ARRAY_SORT(ARRAY_SHUFFLE([1, 2, 3, 4], 1 + 1));
```

```text
[1, 2, 3, 4]    [1, 2, 3, 4]
```

NULL and empty arrays:

```sql
SELECT ARRAY_SHUFFLE(CAST(NULL AS ARRAY<INT>), 1),
       ARRAY_SHUFFLE([1, 2, 3], NULL), ARRAY_SHUFFLE([], 1);
```

```text
NULL    NULL    []
```

Using a column as the seed reports an error containing:

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3], number) FROM numbers("number" = "2");
```

```text
The seed of array_shuffle must be a constant
```
