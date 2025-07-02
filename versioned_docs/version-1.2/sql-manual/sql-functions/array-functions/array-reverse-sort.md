---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "en"
}
---

## array_reverse_sort

<version since="1.2.3">

array_reverse_sort

</version>

### description

#### Syntax

`ARRAY<T> array_reverse_sort(ARRAY<T> arr)`

Return the array which has been sorted in descending order. Return NULL for NULL input.
If the element of array is NULL, it will be placed in the last of the sorted array.

### notice

`Only supported in vectorized engine`

### example

```mysql> select k1, k2, array_reverse_sort(k2) from array_test;
+------+-----------------------------+-----------------------------+
| k1   | k2                          | array_reverse_sort(`k2`)    |
+------+-----------------------------+-----------------------------+
|  1   | [1, 2, 3, 4, 5]             | [5, 4, 3, 2, 1]             |
|  2   | [6, 7, 8]                   | [8, 7, 6]                   |
|  3   | []                          | []                          |
|  4   | NULL                        | NULL                        |
|  5   | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [5, 4, 4, 3, 3, 2, 2, 1, 1] |
|  6   | [1, 2, 3, NULL]             | [3, 2, 1, NULL]             |
|  7   | [1, 2, 3, NULL, NULL]       | [3, 2, 1, NULL, NULL]       |
|  8   | [1, 1, 2, NULL, NULL]       | [2, 1, 1, NULL, NULL]       |
|  9   | [1, NULL, 1, 2, NULL, NULL] | [2, 1, 1, NULL, NULL, NULL] |
+------+-----------------------------+-----------------------------+

mysql> select k1, k2, array_reverse_sort(k2) from array_test01;
+------+------------------------------------------+------------------------------------------+
| k1   | k2                                       | array_reverse_sort(`k2`)                 |
+------+------------------------------------------+------------------------------------------+
|  1   | ['a', 'b', 'c', 'd', 'e']                | ['e', 'd', 'c', 'b', 'a']                |
|  2   | ['f', 'g', 'h']                          | ['h', 'g', 'f']                          |
|  3   | ['']                                     | ['']                                     |
|  3   | [NULL]                                   | [NULL]                                   |
|  5   | ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c'] | ['e', 'd', 'c', 'c', 'b', 'b', 'a', 'a'] |
|  6   | NULL                                     | NULL                                     |
|  7   | ['a', 'b', NULL]                         | ['b', 'a', NULL]                         |
|  8   | ['a', 'b', NULL, NULL]                   | ['b', 'a', NULL, NULL]                  |
+------+------------------------------------------+------------------------------------------+
```

### keywords

ARRAY, SORT, REVERSE, ARRAY_SORT, ARRAY_REVERSE_SORT
