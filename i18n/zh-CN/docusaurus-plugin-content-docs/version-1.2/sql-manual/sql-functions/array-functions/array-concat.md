---
{
    "title": "ARRAY_CONCAT",
    "language": "zh-CN"
}
---

## array_concat

<version since="2.0.0">

array_concat

</version>

## 描述

将输入的所有数组拼接为一个数组

## 语法

`Array<T> array_concat(Array<T>, ...)`

## 返回值

拼接好的数组

类型: Array.

## 注意事项

`只支持在向量化引擎中使用`

## 举例

```
mysql> select array_concat([1, 2], [7, 8], [5, 6]);
+-----------------------------------------------------+
| array_concat(ARRAY(1, 2), ARRAY(7, 8), ARRAY(5, 6)) |
+-----------------------------------------------------+
| [1, 2, 7, 8, 5, 6]                                  |
+-----------------------------------------------------+
1 row in set (0.02 sec)

mysql> select col2, col3, array_concat(col2, col3) from array_test;
+--------------+-----------+------------------------------+
| col2         | col3      | array_concat(`col2`, `col3`) |
+--------------+-----------+------------------------------+
| [1, 2, 3]    | [3, 4, 5] | [1, 2, 3, 3, 4, 5]           |
| [1, NULL, 2] | [NULL]    | [1, NULL, 2, NULL]           |
| [1, 2, 3]    | NULL      | NULL                         |
| []           | []        | []                           |
+--------------+-----------+------------------------------+
```


### keywords

ARRAY,CONCAT,ARRAY_CONCAT