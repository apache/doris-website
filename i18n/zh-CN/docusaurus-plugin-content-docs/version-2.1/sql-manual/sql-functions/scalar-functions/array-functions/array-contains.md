---
{
    "title": "ARRAY_CONTAINS",
    "language": "zh-CN",
    "description": "arraycontains"
}
---

## 描述

判断数组中是否包含 value。返回结果如下：

```
1    - value 在数组 arr 中存在；
0    - value 不存在数组 arr 中；
NULL - arr 为 NULL 时。
```

## 语法

`BOOLEAN array_contains(ARRAY<T> arr, T value)`

## 举例

```
mysql> SELECT id,c_array,array_contains(c_array, 5) FROM `array_test`;
+------+-----------------+------------------------------+
| id   | c_array         | array_contains(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            1 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+

mysql> select array_contains([null, 1], null);
+--------------------------------------+
| array_contains(ARRAY(NULL, 1), NULL) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+
1 row in set (0.00 sec)
```

### keywords

ARRAY,CONTAIN,CONTAINS,ARRAY_CONTAINS
