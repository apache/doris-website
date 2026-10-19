---
{
    "title": "ARRAY_CONTAINS_ALL",
    "language": "ko",
    "description": "arraycontainsall"
}
---

## array_contains_all {#array_contains_all}

array_contains_all

### 설명 {#description}

#### 구문 {#syntax}

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

array1에 하위 배열 array2가 포함되어 있는지 확인하며, 요소의 순서가 정확히 일치해야 합니다. 반환 결과는 다음과 같습니다:

```
1    - array1 contains subarray array2;
0    - array1 does not contain subarray array2;
NULL - array1 or array2 is NULL.
```

### 예제 {#example}

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

### 키워드 {#keywords}

ARRAY,CONTAIN,ARRAY_CONTAINS_ALL
