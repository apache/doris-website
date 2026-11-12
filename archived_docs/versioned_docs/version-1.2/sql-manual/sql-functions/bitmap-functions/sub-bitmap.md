---
{
    "title": "SUB_BITMAP",
    "language": "en"
}
---

## sub_bitmap

### description
#### Syntax

`BITMAP SUB_BITMAP(BITMAP src, BIGINT offset, BIGINT cardinality_limit)`

Starting from the position specified by offset, intercept cardinality_limit bitmap elements and return a bitmap subset.

### example

```
mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
+-------+
| value |
+-------+
| 0,1,2 |
+-------+

mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
+-------+
| value |
+-------+
| 2,3   |
+-------+

mysql> select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```

### keywords

    SUB_BITMAP,BITMAP_SUBSET,BITMAP
