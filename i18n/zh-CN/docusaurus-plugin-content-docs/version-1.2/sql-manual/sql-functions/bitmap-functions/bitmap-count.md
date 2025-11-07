---
{
    "title": "BITMAP_COUNT",
    "language": "zh-CN"
}
---

## bitmap_count
## 描述
## 语法

`BITMAP BITMAP_COUNT(BITMAP lhs)`

返回输入bitmap的个数。

## 举例

```
mysql> select bitmap_count(to_bitmap(1)) cnt;
+------+
| cnt  |
+------+
|    1 |
+------+

mysql> select bitmap_count(bitmap_and(to_bitmap(1), to_bitmap(1))) cnt;
+------+
| cnt  |
+------+
|    1 |
+------+

```

### keywords

    BITMAP_COUNT
