---
{
    "title": "BITMAP_TO_BASE64",
    "language": "en"
}
---

## bitmap_to_base64

### description
#### Syntax

`VARCHAR BITMAP_TO_BASE64(BITMAP input)`

Convert an input BITMAP to a base64 string. If input is null, return null. Since BE config item `enable_set_in_bitmap_value` will change the format of bitmap value in memory, it also affect the result of this function.

### example

```
mysql> select bitmap_to_base64(null);
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+

mysql> select bitmap_to_base64(bitmap_empty());
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+

mysql> select bitmap_to_base64(to_bitmap(1));
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| AQEAAAA=                       |
+--------------------------------+

mysql> select bitmap_to_base64(bitmap_from_string("1,9999999"));
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+

```

### keywords

    BITMAP_TO_BASE64,BITMAP
