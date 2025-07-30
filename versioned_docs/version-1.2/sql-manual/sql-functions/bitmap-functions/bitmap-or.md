---
{
    "title": "BITMAP_OR",
    "language": "en"
}
---

## bitmap_or
### description
#### Syntax

`BITMAP BITMAP_OR(BITMAP lhs, BITMAP rhs, ...)`

Compute union of two or more input bitmaps, returns the new bitmap.

### example

```
mysql> select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(1))) cnt;
+------+
| cnt  |
+------+
|    1 |
+------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) ;
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(1))) |
+---------------------------------------------------------+
| 1                                                       |
+---------------------------------------------------------+

mysql> select bitmap_count(bitmap_or(to_bitmap(1), to_bitmap(2))) cnt;
+------+
| cnt  |
+------+
|    2 |
+------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL));
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), NULL)) |
+--------------------------------------------------------------------------------------------+
| 0,1,2,10                                                                                   |
+--------------------------------------------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2),to_bitmap(10),to_bitmap(0),bitmap_empty()));
+------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2), to_bitmap(10), to_bitmap(0), bitmap_empty())) |
+------------------------------------------------------------------------------------------------------+
| 0,1,2,10                                                                                             |
+------------------------------------------------------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) ;
+--------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(10), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) |
+--------------------------------------------------------------------------------------------------------+
| 1,2,3,4,5,10                                                                                           |
+--------------------------------------------------------------------------------------------------------+
```

### keywords

    BITMAP_OR,BITMAP
