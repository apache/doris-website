---
{
    "title": "BITMAP_MAX",
    "language": "zh-CN"
}
---

## bitmap_max
## 描述
## 语法

`BIGINT BITMAP_MAX(BITMAP input)`

计算并返回 bitmap 中的最大值.

## 举例

```
mysql> select bitmap_max(bitmap_from_string('')) value;
+-------+
| value |
+-------+
|  NULL |
+-------+

mysql> select bitmap_max(bitmap_from_string('1,9999999999')) value;
+------------+
| value      |
+------------+
| 9999999999 |
+------------+
```

### keywords

    BITMAP_MAX,BITMAP
