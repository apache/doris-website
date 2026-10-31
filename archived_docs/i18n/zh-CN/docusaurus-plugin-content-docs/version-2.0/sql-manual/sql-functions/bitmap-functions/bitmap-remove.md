---
{
    "title": "BITMAP_REMOVE",
    "language": "zh-CN"
}
---

## bitmap_remove
## 描述
## 语法

`BITMAP BITMAP_REMOVE(BITMAP bitmap, BIGINT input)`

从Bitmap列中删除指定的值。

## 举例

```
mysql [(none)]>select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res; 
+------+
| res  |
+------+
| 1,2  |
+------+

mysql [(none)]>select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
+------+
| res  |
+------+
| NULL |
+------+
```

### keywords

    BITMAP_REMOVE,BITMAP
