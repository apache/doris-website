---
{
    "title": "BITMAP_HAS_ANY",
    "language": "en"
}
---

## bitmap_has_any
### description
#### Syntax

`BOOLEAN BITMAP_HAS_ANY(BITMAP lhs, BITMAP rhs)`

Calculate whether there are intersecting elements in the two Bitmap columns. The return value is Boolean.

### example

```
mysql> select bitmap_has_any(to_bitmap(1),to_bitmap(2));
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+

mysql> select bitmap_has_any(to_bitmap(1),to_bitmap(1));
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```

### keywords

    BITMAP_HAS_ANY,BITMAP
