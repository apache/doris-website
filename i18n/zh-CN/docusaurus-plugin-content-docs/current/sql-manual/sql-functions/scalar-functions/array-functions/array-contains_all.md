---
{
    "title": "ARRAY_CONTAINS_ALL",
    "language": "zh-CN",
    "description": "arraycontainsall"
}
---

## array_contains_all

array_contains_all

## 描述

## 语法

`BOOLEAN array_contains_all(ARRAY<T> array1, ARRAY<T> array2)`

判断数组 array1 中是否包含子数组 array2，且需要保证元素顺序完全一致。返回结果如下：

```
1    - array1中存在子数组array2；
0    - array1中不存在数组array2；
NULL - array1或array2为NULL。
```

## 举例

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
