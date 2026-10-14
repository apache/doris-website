---
{
    "title": "ARRAY_CONTAINS_ALL",
    "language": "ja",
    "description": "array1 に部分配列 array2 が要素の順序どおりに含まれるかを判定します。"
}
---

## array_contains_all

array_contains_all

### 説明

#### 構文

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

array1 に部分配列 array2 が含まれるかを、要素の順序が完全に一致することを条件に判定します。戻り値は次のとおりです。

```
1    - array1 contains subarray array2;
0    - array1 does not contain subarray array2;
NULL - array1 or array2 is NULL.
```

### 例

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

### キーワード

ARRAY,CONTAIN,ARRAY_CONTAINS_ALL
