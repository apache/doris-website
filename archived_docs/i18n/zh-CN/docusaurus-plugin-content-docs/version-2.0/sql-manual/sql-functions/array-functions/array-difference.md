---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "zh-CN"
}
---

## array_difference

array_difference

## 描述

## 语法

`ARRAY<T> array_difference(ARRAY<T> arr)`

计算相邻数组元素之间的差异。返回一个数组，其中第一个元素将为0，第二个元素是a[1]-a[0]之间的差值。
注意若 NULL 值存在，返回结果为NULL

## 举例

```
mysql> select *,array_difference(k2) from array_type_table;
+------+-----------------------------+---------------------------------+
| k1   | k2                          | array_difference(`k2`)          |
+------+-----------------------------+---------------------------------+
|    0 | []                          | []                              |
|    1 | [NULL]                      | [NULL]                          |
|    2 | [1, 2, 3]                   | [0, 1, 1]                       |
|    3 | [1, NULL, 3]                | [0, NULL, NULL]                 |
|    4 | [0, 1, 2, 3, NULL, 4, 6]    | [0, 1, 1, 1, NULL, NULL, 2]     |
|    5 | [1, 2, 3, 4, 5, 4, 3, 2, 1] | [0, 1, 1, 1, 1, -1, -1, -1, -1] |
|    6 | [6, 7, 8]                   | [0, 1, 1]                       |
+------+-----------------------------+---------------------------------+

```

### keywords

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE
