---
{
    "title": "ARRAY_PUSHBACK",
    "language": "zh-CN"
}
---

## array_pushback

array_pushback

## 描述

## 语法

`Array<T> array_pushback(Array<T> arr, T value)`

将 value 添加到数组的尾部。

## 返回值

返回添加 value 后的数组

类型：Array.

## 举例

```
mysql> select array_pushback([1, 2], 3);
+---------------------------------+
| array_pushback(ARRAY(1, 2), 3)  |
+---------------------------------+
| [1, 2, 3]                       |
+---------------------------------+

mysql> select col3, array_pushback(col3, 6) from array_test;
+-----------+----------------------------+
| col3      | array_pushback(`col3`, 6)  |
+-----------+----------------------------+
| [3, 4, 5] | [3, 4, 5, 6]               |
| [NULL]    | [NULL, 6]                  |
| NULL      | NULL                       |
| []        | [6]                        |
+-----------+----------------------------+

mysql> select col1, col3, array_pushback(col3, col1) from array_test;
+------+-----------+---------------------------------+
| col1 | col3      | array_pushback(`col3`, `col1`)  |
+------+-----------+---------------------------------+
|    0 | [3, 4, 5] | [3, 4, 5, 0]                    |
|    1 | [NULL]    | [NULL, 1]                       |
|    2 | NULL      | NULL                            |
|    3 | []        | [3]                             |
+------+-----------+---------------------------------+
```

### keywords

ARRAY,PUSHBACK,ARRAY_PUSHBACK