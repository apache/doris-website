---
{
    "title": "ARRAY_INTERSECT",
    "language": "en"
}
---

## array_intersect

array_intersect


### description

#### Syntax

`ARRAY<T> array_intersect(ARRAY<T> array1, ARRAY<T> array2)`

Returns an array of the elements in the intersection of array1 and array2, without duplicates. If the input parameter is null, null is returned.

### example

```
mysql> select k1,k2,k3,array_intersect(k2,k3) from array_type_table;
+------+-----------------+--------------+-----------------------------+
| k1   | k2              | k3           | array_intersect(`k2`, `k3`) |
+------+-----------------+--------------+-----------------------------+
|    1 | [1, 2, 3]       | [2, 4, 5]    | [2]                         |
|    2 | [2, 3]          | [1, 5]       | []                          |
|    3 | [1, 1, 1]       | [2, 2, 2]    | []                          |
+------+-----------------+--------------+-----------------------------+

mysql> select k1,k2,k3,array_intersect(k2,k3) from array_type_table_nullable;
+------+-----------------+--------------+-----------------------------+
| k1   | k2              | k3           | array_intersect(`k2`, `k3`) |
+------+-----------------+--------------+-----------------------------+
|    1 | [1, NULL, 3]    | [1, 3, 5]    | [1, 3]                      |
|    2 | [NULL, NULL, 2] | [2, NULL, 4] | [NULL, 2]                   |
|    3 | NULL            | [1, 2, 3]    | NULL                        |
+------+-----------------+--------------+-----------------------------+

mysql> select k1,k2,k3,array_intersect(k2,k3) from array_type_table_varchar;
+------+----------------------------+----------------------------------+-----------------------------+
| k1   | k2                         | k3                               | array_intersect(`k2`, `k3`) |
+------+----------------------------+----------------------------------+-----------------------------+
|    1 | ['hello', 'world', 'c++']  | ['I', 'am', 'c++']               | ['c++']                     |
|    2 | ['a1', 'equals', 'b1']     | ['a2', 'equals', 'b2']           | ['equals']                  |
|    3 | ['hasnull', NULL, 'value'] | ['nohasnull', 'nonull', 'value'] | [NULL, 'value']             |
|    3 | ['hasnull', NULL, 'value'] | ['hasnull', NULL, 'value']       | ['hasnull', 'value']        |
+------+----------------------------+----------------------------------+-----------------------------+

mysql> select k1,k2,k3,array_intersect(k2,k3) from array_type_table_decimal;
+------+------------------+-------------------+-----------------------------+
| k1   | k2               | k3                | array_intersect(`k2`, `k3`) |
+------+------------------+-------------------+-----------------------------+
|    1 | [1.1, 2.1, 3.44] | [2.1, 3.4, 5.4]   | [2.1]                       |
|    2 | [NULL, 2, 5]     | [NULL, NULL, 5.4] | [NULL]                      |
|    3 | [1, NULL, 2, 5]  | [1, 3.1, 5.4]     | [1]                         |
+------+------------------+-------------------+-----------------------------+

```

### keywords

ARRAY,INTERSECT,ARRAY_INTERSECT

