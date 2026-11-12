---
{
    "title": "ARRAY_CONTAINS_ALL",
    "language": "ru",
    "description": "arraycontainsall"
}
---

## array_contains_all {#array_contains_all}

array_contains_all

### Описание {#description}

#### Синтаксис {#syntax}

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

Проверяет, содержит ли массив array1 подмассив array2 с точно таким же порядком элементов. Возможные результаты:

```
1    - array1 contains subarray array2;
0    - array1 does not contain subarray array2;
NULL - array1 or array2 is NULL.
```

### Пример {#example}

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

### Ключевые слова {#keywords}

ARRAY,CONTAIN,ARRAY_CONTAINS_ALL
