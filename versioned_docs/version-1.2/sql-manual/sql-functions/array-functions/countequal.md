---
{
    "title": "COUNTEQUAL",
    "language": "en"
}
---

## countequal

countequal

### description

#### Syntax

`BIGINT countequal(ARRAY<T> arr, T value)`

Returns a number of the `value` in the given array.

```
num      - how many the value number in array;
0        - if value does not present in the array;
NULL     - when array is NULL.
```

### notice

`Only supported in vectorized engine`

### example

```
mysql> select *, countEqual(c_array,5) from array_test;
+------+-----------------+--------------------------+
| id   | c_array         | countequal(`c_array`, 5) |
+------+-----------------+--------------------------+
|    1 | [1, 2, 3, 4, 5] |                        1 |
|    2 | [6, 7, 8]       |                        0 |
|    3 | []              |                        0 |
|    4 | NULL            |                     NULL |
+------+-----------------+--------------------------+

mysql> select *,countEqual(c_array, 1),countEqual(c_array, 5),countEqual(c_array, NULL) from array_test;
+------+-----------------------+--------------------------+--------------------------+-----------------------------+
| id   | c_array               | countequal(`c_array`, 1) | countequal(`c_array`, 5) | countequal(`c_array`, NULL) |
+------+-----------------------+--------------------------+--------------------------+-----------------------------+
|    1 | [1, 2, 3, 4, 5]       |                        1 |                        1 |                           0 |
|    2 | [6, 7, 8]             |                        0 |                        0 |                           0 |
|    3 | []                    |                        0 |                        0 |                           0 |
|    4 | NULL                  |                     NULL |                     NULL |                        NULL |
|    5 | [66, 77]              |                        0 |                        0 |                           0 |
|    5 | [66, 77]              |                        0 |                        0 |                           0 |
|    6 | NULL                  |                     NULL |                     NULL |                        NULL |
|    7 | [NULL, NULL, NULL]    |                        0 |                        0 |                           3 |
|    8 | [1, 2, 3, 4, 5, 5, 5] |                        1 |                        3 |                           0 |
+------+-----------------------+--------------------------+--------------------------+-----------------------------+
```

### keywords

ARRAY,COUNTEQUAL,

