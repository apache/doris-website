---
{
    "title": "ARRAY_CONTAINS",
    "language": "en"
}
---

## array_contains

array_contains

### description

#### Syntax

`BOOLEAN array_contains(ARRAY<T> arr, T value)`

Check if a value presents in an array column. Return below values:

```
1    - if value presents in an array;
0    - if value does not present in an array;
NULL - when array is NULL;
```

### notice

`Only supported in vectorized engine`

### example

```
mysql> SELECT id,c_array,array_contains(c_array, 5) FROM `array_test`;
+------+-----------------+------------------------------+
| id   | c_array         | array_contains(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            1 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+

mysql> select array_contains([null, 1], null);
+--------------------------------------+
| array_contains(ARRAY(NULL, 1), NULL) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+
1 row in set (0.00 sec)
```

### keywords

ARRAY,CONTAIN,CONTAINS,ARRAY_CONTAINS

