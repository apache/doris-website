---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "zh-CN"
}
---

## bitmap_to_array

## 描述
## 语法

`ARRAY_BIGINT bitmap_to_array(BITMAP input)`

将一个bitmap转化成一个array 数组。
输入是null的话会返回null。

## 举例

```
mysql> select bitmap_to_array(null);
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+

mysql> select bitmap_to_array(bitmap_empty());
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+

mysql> select bitmap_to_array(to_bitmap(1));
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+

mysql> select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------

```

### keywords

    BITMAP_TO_ARRAY,BITMAP
