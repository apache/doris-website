---
{
    "title": "ARRAY_SORT",
    "language": "en"
}
---

## array_sort

array_sort

### description

#### Syntax

`ARRAY<T> array_sort(ARRAY<T> arr)`

Return the array which has been sorted in ascending order. Return NULL for NULL input.
If the element of array is NULL, it will be placed in the front of the sorted array.

### example

```mysql> select k1, k2, array_sort(k2) from array_test;
+------+-----------------------------+-----------------------------+
| k1   | k2                          | array_sort(`k2`)            |
+------+-----------------------------+-----------------------------+
|  1   | [1, 2, 3, 4, 5]             | [1, 2, 3, 4, 5]             |
|  2   | [6, 7, 8]                   | [6, 7, 8]                   |
|  3   | []                          | []                          |
|  4   | NULL                        | NULL                        |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [1, 1, 2, 2, 3, 3, 4, 4, 5] |
|  6   | [1, 2, 3, NULL]             | [NULL, 1, 2, 3]             |
|  7   | [1, 2, 3, NULL, NULL]       | [NULL, NULL, 1, 2, 3]       |
|  8   | [1, 1, 2, NULL, NULL]       | [NULL, NULL, 1, 1, 2]       |
|  9   | [1, NULL, 1, 2, NULL, NULL] | [NULL, NULL, NULL, 1, 1, 2] |
+------+-----------------------------+-----------------------------+

mysql> select k1, k2, array_sort(k2) from array_test01;
+------+------------------------------------------+------------------------------------------+
| k1   | k2                                       | array_sort(`k2`)                         |
+------+------------------------------------------+------------------------------------------+
|  1   | ['a', 'b', 'c', 'd', 'e']                | ['a', 'b', 'c', 'd', 'e']                |
|  2   | ['f', 'g', 'h']                          | ['f', 'g', 'h']                          |
|  3   | ['']                                     | ['']                                     |
|  3   | [NULL]                                   | [NULL]                                   |
|  5   | ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c'] | ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'e'] |
|  6   | NULL                                     | NULL                                     |
|  7   | ['a', 'b', NULL]                         | [NULL, 'a', 'b']                         |
|  8   | ['a', 'b', NULL, NULL]                   | [NULL, NULL, 'a', 'b']                   |
+------+------------------------------------------+------------------------------------------+
```

### keywords

ARRAY, SORT, ARRAY_SORT

