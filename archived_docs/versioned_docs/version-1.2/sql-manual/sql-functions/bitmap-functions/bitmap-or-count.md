---
{
    "title": "BITMAP_OR_COUNT",
    "language": "en"
}
---

## bitmap_or_count
### description
#### Syntax

`BigIntVal bitmap_or_count(BITMAP lhs, BITMAP rhs)`

Calculates the union of two or more input bitmaps and returns the number of union sets.

### example

```
MySQL> select bitmap_or_count(bitmap_from_string('1,2,3'),bitmap_empty());
+--------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) |
+--------------------------------------------------------------+
|                                                            3 |
+--------------------------------------------------------------+


MySQL> select bitmap_or_count(bitmap_from_string('1,2,3'),bitmap_from_string('1,2,3'));
+---------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) |
+---------------------------------------------------------------------------+
|                                                                         3 |
+---------------------------------------------------------------------------+

MySQL> select bitmap_or_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'));
+---------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) |
+---------------------------------------------------------------------------+
|                                                                         5 |
+---------------------------------------------------------------------------+

MySQL> select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty());
+-----------------------------------------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                         6 |
+-----------------------------------------------------------------------------------------------------------+

MySQL> select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL);
+-------------------------------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) |
+-------------------------------------------------------------------------------------------------+
|                                                                                            NULL |
+-------------------------------------------------------------------------------------------------+
```

### keywords

    BITMAP_OR_COUNT,BITMAP
