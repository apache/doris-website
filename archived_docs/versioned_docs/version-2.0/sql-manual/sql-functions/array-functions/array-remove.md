---
{
    "title": "ARRAY_REMOVE",
    "language": "en"
}
---

## array_remove

array_remove

### description

#### Syntax

`ARRAY<T> array_remove(ARRAY<T> arr, T val)`

Remove all elements that equal to element from array.

### example

```
mysql> select array_remove(['test', NULL, 'value'], 'value');
+-----------------------------------------------------+
| array_remove(ARRAY('test', NULL, 'value'), 'value') |
+-----------------------------------------------------+
| [test, NULL]                                        |
+-----------------------------------------------------+

mysql> select k1, k2, array_remove(k2, 1) from array_type_table_1;
+------+--------------------+-----------------------+
| k1   | k2                 | array_remove(`k2`, 1) |
+------+--------------------+-----------------------+
|    1 | [1, 2, 3]          | [2, 3]                |
|    2 | [1, 3]             | [3]                   |
|    3 | NULL               | NULL                  |
|    4 | [1, 3]             | [3]                   |
|    5 | [NULL, 1, NULL, 2] | [NULL, NULL, 2]       |
+------+--------------------+-----------------------+

mysql> select k1, k2, array_remove(k2, k1) from array_type_table_1;
+------+--------------------+--------------------------+
| k1   | k2                 | array_remove(`k2`, `k1`) |
+------+--------------------+--------------------------+
|    1 | [1, 2, 3]          | [2, 3]                   |
|    2 | [1, 3]             | [1, 3]                   |
|    3 | NULL               | NULL                     |
|    4 | [1, 3]             | [1, 3]                   |
|    5 | [NULL, 1, NULL, 2] | [NULL, 1, NULL, 2]       |
+------+--------------------+--------------------------+

mysql> select k1, k2, array_remove(k2, date('2022-10-10')) from array_type_table_date;
+------+--------------------------+-------------------------------------------------+
| k1   | k2                       | array_remove(`k2`, date('2022-10-10 00:00:00')) |
+------+--------------------------+-------------------------------------------------+
|    1 | [2021-10-10, 2022-10-10] | [2021-10-10]                                    |
|    2 | [NULL, 2022-05-14]       | [NULL, 2022-05-14]                              |
+------+--------------------------+-------------------------------------------------+

mysql> select k1, k2, array_remove(k2, k1) from array_type_table_nullable;
+------+-----------+--------------------------+
| k1   | k2        | array_remove(`k2`, `k1`) |
+------+-----------+--------------------------+
| NULL | [1, 2, 3] | NULL                     |
|    1 | NULL      | NULL                     |
| NULL | [NULL, 1] | NULL                     |
|    1 | [NULL, 1] | [NULL]                   |
+------+-----------+--------------------------+

```

### keywords

ARRAY,REMOVE,ARRAY_REMOVE

