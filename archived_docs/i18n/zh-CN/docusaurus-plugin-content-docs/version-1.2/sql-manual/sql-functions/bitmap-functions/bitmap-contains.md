---
{
    "title": "BITMAP_CONTAINS",
    "language": "zh-CN"
}
---

## bitmap_contains
## 描述
## 语法

`BOOLEAN BITMAP_CONTAINS(BITMAP bitmap, BIGINT input)`

计算输入值是否在Bitmap列中，返回值是Boolean值.

## 举例

```
mysql> select bitmap_contains(to_bitmap(1),2) cnt;
+------+
| cnt  |
+------+
|    0 |
+------+

mysql> select bitmap_contains(to_bitmap(1),1) cnt;
+------+
| cnt  |
+------+
|    1 |
+------+
```

### keywords

    BITMAP_CONTAINS,BITMAP
