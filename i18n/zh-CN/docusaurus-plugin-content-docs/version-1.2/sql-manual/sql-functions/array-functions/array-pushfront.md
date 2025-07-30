---
{
    "title": "ARRAY_PUSHFRONT",
    "language": "zh-CN"
}
---

## array_pushfront

<version since="1.2.3">

array_pushfront

</version>

## 描述

## 语法

`Array<T> array_pushfront(Array<T> arr, T value)`
将value添加到数组的开头.

## 返回值

返回添加value后的数组

类型: Array.

## 注意事项

`只支持在向量化引擎中使用`

## 举例

```
mysql> select array_pushfront([1, 2], 3);
+---------------------------------+
| array_pushfront(ARRAY(1, 2), 3) |
+---------------------------------+
| [3, 1, 2]                       |
+---------------------------------+

mysql> select col3, array_pushfront(col3, 6) from array_test;
+-----------+----------------------------+
| col3      | array_pushfront(`col3`, 6) |
+-----------+----------------------------+
| [3, 4, 5] | [6, 3, 4, 5]               |
| [NULL]    | [6, NULL]                  |
| NULL      | NULL                       |
| []        | [6]                        |
+-----------+----------------------------+

mysql> select col1, col3, array_pushfront(col3, col1) from array_test;
+------+-----------+---------------------------------+
| col1 | col3      | array_pushfront(`col3`, `col1`) |
+------+-----------+---------------------------------+
|    0 | [3, 4, 5] | [0, 3, 4, 5]                    |
|    1 | [NULL]    | [1, NULL]                       |
|    2 | NULL      | NULL                            |
|    3 | []        | [3]                             |
+------+-----------+---------------------------------+
```

### keywords

ARRAY,PUSHFRONT,ARRAY_PUSHFRONT