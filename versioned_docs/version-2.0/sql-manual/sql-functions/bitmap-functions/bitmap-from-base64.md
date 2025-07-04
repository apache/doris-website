---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "en"
}
---

## bitmap_from_base64

### description
#### Syntax

`BITMAP BITMAP_FROM_BASE64(VARCHAR input)`

Convert a base64 string(result of function `bitmap_to_base64`) into a bitmap. If input string is invalid, return NULL.

### example

```
mysql> select bitmap_to_string(bitmap_from_base64("AA=="));
+----------------------------------------------+
| bitmap_to_string(bitmap_from_base64("AA==")) |
+----------------------------------------------+
|                                              |
+----------------------------------------------+

mysql> select bitmap_to_string(bitmap_from_base64("AQEAAAA="));
+-----------------------------------+
| bitmap_to_string(bitmap_from_base64("AQEAAAA=")) |
+-----------------------------------+
| 1                                 |
+-----------------------------------+

mysql> select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y="));
+----------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) |
+----------------------------------------------------------------------------------+
| 1,9999999                                                                        |
+----------------------------------------------------------------------------------+
```

### keywords

    BITMAP_FROM_BASE64,BITMAP
