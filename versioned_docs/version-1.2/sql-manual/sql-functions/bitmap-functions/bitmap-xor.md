---
{
    "title": "BITMAP_XOR",
    "language": "en"
}
---

## bitmap_xor
### description
#### Syntax

`BITMAP BITMAP_XOR(BITMAP lhs, BITMAP rhs, ...)`

Compute the symmetric union of two or more input bitmaps, return the new bitmap.

### example

```
mysql> select bitmap_count(bitmap_xor(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4'))) cnt;
+------+
| cnt  |
+------+
|    2 |
+------+

mysql> select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 1,4                                                                                    |
+----------------------------------------------------------------------------------------+

MySQL> select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4'),bitmap_from_string('3,4,5')));
+---------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) |
+---------------------------------------------------------------------------------------------------------------------+
| 1,3,5                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------+

MySQL> select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4'),bitmap_from_string('3,4,5'),bitmap_empty()));
+-------------------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) |
+-------------------------------------------------------------------------------------------------------------------------------------+
| 1,3,5                                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+

MySQL> select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4'),bitmap_from_string('3,4,5'),NULL));
+---------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) |
+---------------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------+
```

### keywords

    BITMAP_XOR,BITMAP
