---
{
    "title": "BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT",
    "language": "zh-CN"
}
---

## bitmap_and_not_count,bitmap_andnot_count
## 描述
## 语法

`BITMAP BITMAP_AND_NOT_COUNT(BITMAP lhs, BITMAP rhs)`

将两个bitmap进行与非操作并返回计算返回的大小.

## 举例

```
mysql> select bitmap_and_not_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) cnt;
+------+
| cnt  |
+------+
|    2 |
+------+
```

### keywords

    BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT,BITMAP
