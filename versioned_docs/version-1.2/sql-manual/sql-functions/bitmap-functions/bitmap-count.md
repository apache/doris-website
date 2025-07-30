---
{
    "title": "BITMAP_COUNT",
    "language": "en"
}
---

## bitmap_count
### description
#### Syntax

`BITMAP BITMAP_COUNT(BITMAP lhs)`

Returns the number of input bitmaps。

### example

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
