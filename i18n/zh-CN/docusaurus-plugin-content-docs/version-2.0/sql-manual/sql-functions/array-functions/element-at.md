---
{
    "title": "ELEMENT_AT",
    "language": "zh-CN"
}
---

## element_at

element_at

## 描述

## 语法

```sql
T element_at(ARRAY<T> arr, BIGINT position)
T arr[position]
```

返回数组中位置为 `position` 的元素。如果该位置上元素不存在，返回NULL。`position` 从1开始，并且支持负数。

## 举例

`position` 为正数使用范例:

```
mysql> SELECT id,c_array,element_at(c_array, 5) FROM `array_test`;
+------+-----------------+--------------------------+
| id   | c_array         | element_at(`c_array`, 5) |
+------+-----------------+--------------------------+
|    1 | [1, 2, 3, 4, 5] |                        5 |
|    2 | [6, 7, 8]       |                     NULL |
|    3 | []              |                     NULL |
|    4 | NULL            |                     NULL |
+------+-----------------+--------------------------+
```

`position` 为负数使用范例:

```
mysql> SELECT id,c_array,c_array[-2] FROM `array_test`;
+------+-----------------+----------------------------------+
| id   | c_array         | %element_extract%(`c_array`, -2) |
+------+-----------------+----------------------------------+
|    1 | [1, 2, 3, 4, 5] |                                4 |
|    2 | [6, 7, 8]       |                                7 |
|    3 | []              |                             NULL |
|    4 | NULL            |                             NULL |
+------+-----------------+----------------------------------+
```

### keywords

ELEMENT_AT, SUBSCRIPT
