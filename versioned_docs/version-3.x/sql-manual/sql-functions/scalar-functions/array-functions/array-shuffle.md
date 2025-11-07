---
{
    "title": "ARRAY_SHUFFLE",
    "language": "en"
}
---

## Description

Randomly arrange the elements in an array

## Aliases

- SHUFFLE

## Syntax

```sql
ARRAY_SHUFFLE(<array>, <seed>)
```

## Parameters

| Parameter | Description |
|--|--|
| `<array>` | The array to be randomly permuted |
| `<seed>` | An optional parameter that sets the initial value of the pseudo-random number generator used to generate pseudo-random numbers |

## Return Value

Randomize the elements in an array. The parameter array1 is the array to be randomly arranged, and the optional parameter seed is the initial value used by the pseudo-random number generator to generate pseudo-random numbers. shuffle has the same function as array_shuffle.

## Example

```sql
SELECT ARRAY_SHUFFLE([1, 2, 3, 6]),ARRAY_SHUFFLE([1, 4, 3, 5, NULL],1);
```

```text
+-----------------------------+--------------------------------------+
| array_shuffle([1, 2, 3, 6]) | array_shuffle([1, 4, 3, 5, NULL], 1) |
+-----------------------------+--------------------------------------+
| [2, 6, 3, 1]                | [4, 1, 3, 5, null]                   |
+-----------------------------+--------------------------------------+
```
