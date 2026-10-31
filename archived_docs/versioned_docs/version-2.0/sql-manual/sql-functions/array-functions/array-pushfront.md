---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "en"
}
---

## array_pushfront

array_pushfront

### description

#### Syntax

`Array<T> array_pushfront(Array<T> arr, T value)`

Add the value to the beginning of the array.

#### Returned value

The array after adding the value.

Type: Array.

### example

```
mysql> select array_pushfront([1, 2], 3);
+---------------------------------+
| array_pushfront(ARRAY(1, 2), 3) |
+---------------------------------+
| [3, 1, 2]                       |
+---------------------------------+

mysql> select col3, array_pushfront(col3, 6) from array_test;
+-----------+----------------------------+
| col3      | array_pushfront(`col3`, 6) |
+-----------+----------------------------+
| [3, 4, 5] | [6, 3, 4, 5]               |
| [NULL]    | [6, NULL]                  |
| NULL      | NULL                       |
| []        | [6]                        |
+-----------+----------------------------+

mysql> select col1, col3, array_pushfront(col3, col1) from array_test;
+------+-----------+---------------------------------+
| col1 | col3      | array_pushfront(`col3`, `col1`) |
+------+-----------+---------------------------------+
|    0 | [3, 4, 5] | [0, 3, 4, 5]                    |
|    1 | [NULL]    | [1, NULL]                       |
|    2 | NULL      | NULL                            |
|    3 | []        | [3]                             |
+------+-----------+---------------------------------+
```

### keywords

ARRAY,PUSHFRONT,ARRAY_PUSHFRONT