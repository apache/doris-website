---
{
    "title": "ARRAY_SIZE",
    "language": "en"
}
---

## Description

Count the number of elements in an array

## Aliases

- SIZE
- CARDINALITY

## Syntax

```sql
ARRAY_SIZE(<arr>) 
```

## Parameters

| Parameter | Description |
|--|--|
| `<arr>` | The array to be calculated |

## Return Value

Returns the number of elements in the array. If the input array is NULL, it returns NULL.

## Example

```sql
SELECT ARRAY_SIZE(['a', 'b', 'c']),ARRAY_SIZE([NULL]),ARRAY_SIZE([]);
```

```text
+------------------------------+---------------------+-----------------+
| cardinality(['a', 'b', 'c']) | cardinality([NULL]) | cardinality([]) |
+------------------------------+---------------------+-----------------+
|                            3 |                   1 |               0 |
+------------------------------+---------------------+-----------------+
```
