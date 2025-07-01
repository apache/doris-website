---
{
    "title": "ARRAYS_OVERLAP",
    "language": "en"
}
---

## arrays_overlap

arrays_overlap

### description

#### Syntax

`BOOLEAN arrays_overlap(ARRAY<T> left, ARRAY<T> right)`

Check if there is any common element for left and right array. Return below values:

```
1    - if any common element inside left and right array;
0    - if no common element inside left and right array;
NULL - when left or right array is NULL; OR any element inside left and right array is NULL;
```

### notice

`Only supported in vectorized engine`

### example

```
mysql> select c_left,c_right,arrays_overlap(c_left,c_right) from array_test;
+--------------+-----------+-------------------------------------+
| c_left       | c_right   | arrays_overlap(`c_left`, `c_right`) |
+--------------+-----------+-------------------------------------+
| [1, 2, 3]    | [3, 4, 5] |                                   1 |
| [1, 2, 3]    | [5, 6]    |                                   0 |
| [1, 2, NULL] | [1]       |                                NULL |
| NULL         | [1, 2]    |                                NULL |
| [1, 2, 3]    | [1, 2]    |                                   1 |
+--------------+-----------+-------------------------------------+
```

### keywords

ARRAY,ARRAYS,OVERLAP,ARRAYS_OVERLAP
