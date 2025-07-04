---
{
    "title": "BITMAP_MIN",
    "language": "zh-CN"
}
---

## bitmap_min
## 描述
## 语法

`BIGINT BITMAP_MIN(BITMAP input)`

计算并返回 bitmap 中的最小值.

## 举例

```
mysql> select bitmap_min(bitmap_from_string('')) value;
+-------+
| value |
+-------+
|  NULL |
+-------+

mysql> select bitmap_min(bitmap_from_string('1,9999999999')) value;
+-------+
| value |
+-------+
|     1 |
+-------+
```

### keywords

    BITMAP_MIN,BITMAP
