---
{
  "title": "ARRAY_CONTAINS_ALL",
  "language": "ja",
  "description": "arraycontainsall"
}
---
## array_contains_all

array_contains_all

### 説明

#### 構文

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

array1がサブ配列array2を含んでいるかどうかをチェックし、要素の順序が完全に同じであることを確認します。戻り値は以下の通りです：

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
