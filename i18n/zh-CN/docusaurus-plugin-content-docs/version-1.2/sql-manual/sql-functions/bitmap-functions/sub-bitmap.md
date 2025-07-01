---
{
    "title": "SUB_BITMAP",
    "language": "zh-CN"
}
---

## sub_bitmap

## 描述

## 语法

`BITMAP SUB_BITMAP(BITMAP src, BIGINT offset, BIGINT cardinality_limit)`

从 offset 指定位置开始，截取 cardinality_limit 个 bitmap 元素，返回一个 bitmap 子集。

## 举例

```
mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
+-------+
| value |
+-------+
| 0,1,2 |
+-------+

mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
+-------+
| value |
+-------+
| 2,3   |
+-------+

mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

### keywords

    SUB_BITMAP,BITMAP_SUBSET,BITMAP
