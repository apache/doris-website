---
{
    "title": "ARRAY_SIZE",
    "language": "en"
}
---

## array_size (size, cardinality)
array_size (size, cardinality)
### description

#### Syntax

```sql
BIGINT size(ARRAY<T> arr) 
BIGINT array_size(ARRAY<T> arr) 
BIGINT cardinality(ARRAY<T> arr)
```

Returns the size of the array, returns NULL for NULL input.

### example

```
mysql> select k1,k2,size(k2) from array_test;
+------+-----------+------------+
| k1   | k2        | size(`k2`) |
+------+-----------+------------+
|    1 | [1, 2, 3] |          3 |
|    2 | []        |          0 |
|    3 | NULL      |       NULL |
+------+-----------+------------+

mysql> select k1,k2,array_size(k2) from array_test;
+------+-----------+------------------+
| k1   | k2        | array_size(`k2`) |
+------+-----------+------------------+
|    1 | [1, 2, 3] |                3 |
|    2 | []        |                0 |
|    3 | NULL      |             NULL |
+------+-----------+------------------+

mysql> select k1,k2,cardinality(k2) from array_test;
+------+-----------+-------------------+
| k1   | k2        | cardinality(`k2`) |
+------+-----------+-------------------+
|    1 | [1, 2, 3] |                 3 |
|    2 | []        |                 0 |
|    3 | NULL      |              NULL |
+------+-----------+-------------------+

```

### keywords

ARRAY_SIZE, SIZE, CARDINALITY

