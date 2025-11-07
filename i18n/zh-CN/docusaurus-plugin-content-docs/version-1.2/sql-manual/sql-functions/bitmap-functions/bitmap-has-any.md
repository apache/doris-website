---
{
    "title": "BITMAP_HAS_ANY",
    "language": "zh-CN"
}
---

## bitmap_has_any
## 描述
## 语法

`BOOLEAN BITMAP_HAS_ANY(BITMAP lhs, BITMAP rhs)`

计算两个Bitmap列是否存在相交元素，返回值是Boolean值. 

## 举例

```
mysql> select bitmap_has_any(to_bitmap(1),to_bitmap(2));
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+

mysql> select bitmap_has_any(to_bitmap(1),to_bitmap(1));
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```

### keywords

    BITMAP_HAS_ANY,BITMAP
