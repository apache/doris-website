---
{
    "title": "ARRAY_POSITION",
    "language": "en"
}
---

## array_position

array_position

### description

#### Syntax

`BIGINT array_position(ARRAY<T> arr, T value)`

Returns a position/index of first occurrence of the `value` in the given array.

```
position - value position in array (starts with 1);
0        - if value does not present in the array;
NULL     - when array is NULL.
```

### example

```
mysql> SELECT id,c_array,array_position(c_array, 5) FROM `array_test`;
+------+-----------------+------------------------------+
| id   | c_array         | array_position(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            5 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+

mysql> select array_position([1, null], null);
+--------------------------------------+
| array_position(ARRAY(1, NULL), NULL) |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
1 row in set (0.01 sec)
```

### keywords

ARRAY,POSITION,ARRAY_POSITION

