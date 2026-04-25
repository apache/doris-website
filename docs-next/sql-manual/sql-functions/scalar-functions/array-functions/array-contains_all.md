---
{
    "title": "ARRAY_CONTAINS_ALL",
    "language": "en",
    "description": "arraycontainsall"
}
---

## array_contains_all

array_contains_all

### description

#### Syntax

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

check whether array1 contains the subarray array2, ensuring that the element order is exactly the same. The return results are as follows:

```
1    - array1 contains subarray array2;
0    - array1 does not contain subarray array2;
NULL - array1 or array2 is NULL.
```

### example

```
mysql [(none)]>select array_contains_all([1,2,3,4], [1,2,4]);
+---------------------------------------------+
| array_contains_all([1, 2, 3, 4], [1, 2, 4]) |
+---------------------------------------------+
|                                           0 |
+---------------------------------------------+
1 row in set (0.01 sec)

mysql [(none)]>select array_contains_all([1,2,3,4], [1,2]);
+------------------------------------------+
| array_contains_all([1, 2, 3, 4], [1, 2]) |
+------------------------------------------+
|                                        1 |
+------------------------------------------+
1 row in set (0.01 sec)

mysql [(none)]>select array_contains_all([1,2,3,4], []);
+--------------------------------------------------------------+
| array_contains_all([1, 2, 3, 4], cast([] as ARRAY<TINYINT>)) |
+--------------------------------------------------------------+
|                                                            1 |
+--------------------------------------------------------------+
1 row in set (0.01 sec)

mysql [(none)]>select array_contains_all([1,2,3,4], NULL);
+----------------------------------------+
| array_contains_all([1, 2, 3, 4], NULL) |
+----------------------------------------+
|                                   NULL |
+----------------------------------------+
1 row in set (0.00 sec)
```

### keywords

ARRAY,CONTAIN,ARRAY_CONTAINS_ALL

