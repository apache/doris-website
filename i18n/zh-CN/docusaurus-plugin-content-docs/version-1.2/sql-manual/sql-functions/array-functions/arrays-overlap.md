---
{
    "title": "ARRAYS_OVERLAP",
    "language": "zh-CN"
}
---

## arrays_overlap

arrays_overlap

## 描述

## 语法

`BOOLEAN arrays_overlap(ARRAY<T> left, ARRAY<T> right)`

判断left和right数组中是否包含公共元素。返回结果如下：

```
1    - left和right数组存在公共元素；
0    - left和right数组不存在公共元素；
NULL - left或者right数组为NULL；或者left和right数组中，任意元素为NULL；
```

## 注意事项

`仅支持向量化引擎中使用`

## 举例

```
mysql> select c_left,c_right,arrays_overlap(c_left,c_right) from array_test;
+--------------+-----------+-------------------------------------+
| c_left       | c_right   | arrays_overlap(`c_left`, `c_right`) |
+--------------+-----------+-------------------------------------+
| [1, 2, 3]    | [3, 4, 5] |                                   1 |
| [1, 2, 3]    | [5, 6]    |                                   0 |
| [1, 2, NULL] | [1]       |                                NULL |
| NULL         | [1, 2]    |                                NULL |
| [1, 2, 3]    | [1, 2]    |                                   1 |
+--------------+-----------+-------------------------------------+
```

### keywords

ARRAY,ARRAYS,OVERLAP,ARRAYS_OVERLAP
