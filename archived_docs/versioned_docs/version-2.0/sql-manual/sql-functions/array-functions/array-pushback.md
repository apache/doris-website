---
{
    "title": "ARRAY_PUSHBACK",
    "language": "en"
}
---

## array_pushback

array_pushback

### description

#### Syntax

`Array<T> array_pushback(Array<T> arr, T value)`

Add the value to the end of the array.

#### Returned value

The array after adding the value.

Type: Array.

### example

```
mysql> select array_pushback([1, 2], 3);
+---------------------------------+
| array_pushback(ARRAY(1, 2), 3)  |
+---------------------------------+
| [1, 2, 3]                       |
+---------------------------------+

mysql> select col3, array_pushback(col3, 6) from array_test;
+-----------+----------------------------+
| col3      | array_pushback(`col3`, 6)  |
+-----------+----------------------------+
| [3, 4, 5] | [3, 4, 5, 6]               |
| [NULL]    | [NULL, 6]                  |
| NULL      | NULL                       |
| []        | [6]                        |
+-----------+----------------------------+

mysql> select col1, col3, array_pushback(col3, col1) from array_test;
+------+-----------+---------------------------------+
| col1 | col3      | array_pushback(`col3`, `col1`)  |
+------+-----------+---------------------------------+
|    0 | [3, 4, 5] | [3, 4, 5, 0]                    |
|    1 | [NULL]    | [NULL, 1]                       |
|    2 | NULL      | NULL                            |
|    3 | []        | [3]                             |
+------+-----------+---------------------------------+
```

### keywords

ARRAY,PUSHBACK,ARRAY_PUSHBACK