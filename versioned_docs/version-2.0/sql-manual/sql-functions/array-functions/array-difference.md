---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "en"
}
---

## array_difference

array_difference

### description

#### Syntax

`ARRAY<T> array_difference(ARRAY<T> arr)`

Calculates the difference between adjacent array elements. 
Returns an array where the first element will be 0, the second is the difference between a[1] - a[0].
need notice that NULL will be return NULL

### example

```
mysql> select *,array_difference(k2) from array_type_table;
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

### keywords

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE

