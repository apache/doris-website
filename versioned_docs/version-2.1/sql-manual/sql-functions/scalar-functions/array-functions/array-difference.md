---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "en",
    "description": "Calculates the difference between adjacent array elements. Returns an array where the first element will be 0,"
}
---

## Description
Calculates the difference between adjacent array elements.
Returns an array where the first element will be 0, the second is the difference between a[1] - a[0].
need notice that NULL will be return NULL

## Syntax
```sql
ARRAY_DIFFERENCE(<arr>)
```

## Parameters

| Parameter | Description |
|---|---|
| `<arr>`   | The array to calculate the difference from |

## Return Value

Returns an array. Special cases:
- If a NULL value exists in the input, the result will be NULL.

## Example

```sql
CREATE TABLE array_type_table (
   k1 INT,
   k2 ARRAY<INT>
)
duplicate key (k1)
distributed by hash(k1) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_type_table (k1, k2) VALUES
(0, []),
(1, [NULL]),
(2, [1, 2, 3]),
(3, [1, NULL, 3]),
(4, [0, 1, 2, 3, NULL, 4, 6]),
(5, [1, 2, 3, 4, 5, 4, 3, 2, 1]),
(6, [6, 7, 8]);
select *,array_difference(k2) from array_type_table;
```
```text
+------+-----------------------------+---------------------------------+
| k1   | k2                          | array_difference(`k2`)          |
+------+-----------------------------+---------------------------------+
|    0 | []                          | []                              |
|    1 | [NULL]                      | [NULL]                          |
|    2 | [1, 2, 3]                   | [0, 1, 1]                       |
|    3 | [1, NULL, 3]                | [0, NULL, NULL]                 |
|    4 | [0, 1, 2, 3, NULL, 4, 6]    | [0, 1, 1, 1, NULL, NULL, 2]     |
|    5 | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [0, 1, 1, 1, 1, -1, -1, -1, -1] |
|    6 | [6, 7, 8]                   | [0, 1, 1]                       |
+------+-----------------------------+---------------------------------+
```