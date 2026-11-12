---
{
    "title": "BITMAP_NOT",
    "language": "zh-CN"
}
---

## bitmap_not
## 描述
## 语法

`BITMAP BITMAP_NOT(BITMAP lhs, BITMAP rhs)`

计算lhs减去rhs之后的集合，返回新的bitmap.

## 举例

```
mysql> select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
|                                                                                        |
+----------------------------------------------------------------------------------------+
1 row in set (0.01 sec)

mysql> select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 5                                                                                      |
+----------------------------------------------------------------------------------------+
```

### keywords

    BITMAP_NOT,BITMAP
