---
{
    "title": "BITMAP_AND_NOT",
    "language": "en"
}
---

## bitmap_and_not
### description
#### Syntax

`BITMAP BITMAP_AND_NOT(BITMAP lhs, BITMAP rhs)`

Calculate the set after lhs minus intersection of two input bitmaps, return the new bitmap.

### example

```
mysql> select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
+------+
| cnt  |
+------+
|    2 |
+------+

mysql> select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')));
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'))) |
+--------------------------------------------------------------------------------------------+
| 1,2                                                                                        |
+--------------------------------------------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty())) ;
+-------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_empty())) |
+-------------------------------------------------------------------------------+
| 1,2,3                                                                         |
+-------------------------------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL));
+---------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), NULL)) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```

### keywords

    BITMAP_AND_NOT,BITMAP
