---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "en"
}
---

## bitmap_to_array

### description
#### Syntax

`ARRAY_BIGINT bitmap_to_array(BITMAP input)`

Convert a input BITMAP to Array.
If input is null, return null.

### example

```
mysql> select bitmap_to_array(null);
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+

mysql> select bitmap_to_array(bitmap_empty());
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+

mysql> select bitmap_to_array(to_bitmap(1));
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+

mysql> select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------

```

### keywords

    BITMAP_TO_ARRAY,BITMAP
