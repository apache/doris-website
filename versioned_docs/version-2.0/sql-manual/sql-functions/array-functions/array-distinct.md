---
{
    "title": "ARRAY_DISTINCT",
    "language": "en"
}
---

## array_distinct

array_distinct

### description

#### Syntax

`ARRAY<T> array_distinct(ARRAY<T> arr)`

Return the array which has been removed duplicate values.
Return NULL for NULL input.

### example

```
mysql> select k1, k2, array_distinct(k2) from array_test;
+------+-----------------------------+---------------------------+
| k1   | k2                          | array_distinct(k2)        |
+------+-----------------------------+---------------------------+
| 1    | [1, 2, 3, 4, 5]             | [1, 2, 3, 4, 5]           |
| 2    | [6, 7, 8]                   | [6, 7, 8]                 |
| 3    | []                          | []                        |
| 4    | NULL                        | NULL                      |
| 5    | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [1, 2, 3, 4, 5]           |
| 6    | [1, 2, 3, NULL]             | [1, 2, 3, NULL]           |
| 7    | [1, 2, 3, NULL, NULL]       | [1, 2, 3, NULL]     |
+------+-----------------------------+---------------------------+

mysql> select k1, k2, array_distinct(k2) from array_test01;
+------+------------------------------------------+---------------------------+
| k1   | k2                                       | array_distinct(`k2`)      |
+------+------------------------------------------+---------------------------+
| 1    | ['a', 'b', 'c', 'd', 'e']                | ['a', 'b', 'c', 'd', 'e'] |
| 2    | ['f', 'g', 'h']                          | ['f', 'g', 'h']           |
| 3    | ['']                                     | ['']                      |
| 3    | [NULL]                                   | [NULL]                    |
| 5    | ['a', 'b', 'c', 'd', 'e', 'a', 'b', 'c'] | ['a', 'b', 'c', 'd', 'e'] |
| 6    | NULL                                     | NULL                      |
| 7    | ['a', 'b', NULL]                         | ['a', 'b', NULL]          |
| 8    | ['a', 'b', NULL, NULL]                   | ['a', 'b', NULL]    |
+------+------------------------------------------+---------------------------+
```

### keywords

ARRAY, DISTINCT, ARRAY_DISTINCT

