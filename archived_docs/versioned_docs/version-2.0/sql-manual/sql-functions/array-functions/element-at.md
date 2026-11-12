---
{
    "title": "ELEMENT_AT",
    "language": "en"
}
---

## element_at

element_at

### description

#### Syntax

```sql
T element_at(ARRAY<T> arr, BIGINT position)
T arr[position]
```

Returns an element of an array located at the input position. If there is no element at the position, return NULL.

`position` is 1-based and support negative number.

### example

positive `position` example:

```
mysql> SELECT id,c_array,element_at(c_array, 5) FROM `array_test`;
+------+-----------------+--------------------------+
| id   | c_array         | element_at(`c_array`, 5) |
+------+-----------------+--------------------------+
|    1 | [1, 2, 3, 4, 5] |                        5 |
|    2 | [6, 7, 8]       |                     NULL |
|    3 | []              |                     NULL |
|    4 | NULL            |                     NULL |
+------+-----------------+--------------------------+
```

negative `position` example:

```
mysql> SELECT id,c_array,c_array[-2] FROM `array_test`;
+------+-----------------+----------------------------------+
| id   | c_array         | %element_extract%(`c_array`, -2) |
+------+-----------------+----------------------------------+
|    1 | [1, 2, 3, 4, 5] |                                4 |
|    2 | [6, 7, 8]       |                                7 |
|    3 | []              |                             NULL |
|    4 | NULL            |                             NULL |
+------+-----------------+----------------------------------+
```

### keywords

ELEMENT_AT, SUBSCRIPT

