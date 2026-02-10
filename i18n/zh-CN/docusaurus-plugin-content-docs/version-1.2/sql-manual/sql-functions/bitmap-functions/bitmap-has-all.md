---
{
    "title": "BITMAP_HAS_ALL",
    "language": "zh-CN"
}
---

## bitmap_has_all
## 描述
## 语法

`BOOLEAN BITMAP_HAS_ALL(BITMAP lhs, BITMAP rhs)`

如果第一个bitmap包含第二个bitmap的全部元素，则返回true。
如果第二个bitmap包含的元素为空，返回true。

## 举例

```
mysql> select bitmap_has_all(bitmap_from_string("0, 1, 2"), bitmap_from_string("1, 2"));
+---------------------------------------------------------------------------+
| bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+

mysql> select bitmap_has_all(bitmap_empty(), bitmap_from_string("1, 2"));
+------------------------------------------------------------+
| bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) |
+------------------------------------------------------------+
|                                                          0 |
+------------------------------------------------------------+
```

### keywords

    BITMAP_HAS_ALL,BITMAP
