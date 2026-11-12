---
{
    "title": "ARRAY_CONCAT",
    "language": "en"
}
---

## array_concat

array_concat

### description

Concat all arrays passed in the arguments

#### Syntax

`Array<T> array_concat(Array<T>, ...)`

#### Returned value

The concated array.

Type: Array.

### example

```
mysql> select array_concat([1, 2], [7, 8], [5, 6]);
+-----------------------------------------------------+
| array_concat(ARRAY(1, 2), ARRAY(7, 8), ARRAY(5, 6)) |
+-----------------------------------------------------+
| [1, 2, 7, 8, 5, 6]                                  |
+-----------------------------------------------------+
1 row in set (0.02 sec)

mysql> select col2, col3, array_concat(col2, col3) from array_test;
+--------------+-----------+------------------------------+
| col2         | col3      | array_concat(`col2`, `col3`) |
+--------------+-----------+------------------------------+
| [1, 2, 3]    | [3, 4, 5] | [1, 2, 3, 3, 4, 5]           |
| [1, NULL, 2] | [NULL]    | [1, NULL, 2, NULL]           |
| [1, 2, 3]    | NULL      | NULL                         |
| []           | []        | []                           |
+--------------+-----------+------------------------------+
```

### keywords

ARRAY,CONCAT,ARRAY_CONCAT