---
{
    "title": "BITMAP_TO_STRING",
    "language": "en"
}
---

## bitmap_to_string

### description
#### Syntax

`VARCHAR BITMAP_TO_STRING(BITMAP input)`

Convert a input BITMAP to a string. The string is a separated string, contains all set bits in Bitmap.
If input is null, return null.

### example

```
mysql> select bitmap_to_string(null);
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+

mysql> select bitmap_to_string(bitmap_empty());
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+

mysql> select bitmap_to_string(to_bitmap(1));
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
|  1                             |
+--------------------------------+

mysql> select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
|  1,2                                                    |
+---------------------------------------------------------+

```

### keywords

    BITMAP_TO_STRING,BITMAP
