---
{
    "title": "BITMAP_FROM_STRING",
    "language": "en"
}
---

## bitmap_from_string

### description
#### Syntax

`BITMAP BITMAP_FROM_STRING(VARCHAR input)`

Convert a string into a bitmap. The input string should be a comma separated unsigned bigint (ranging from 0 to 18446744073709551615).
For example: input string "0, 1, 2" will be converted to a Bitmap with bit 0, 1, 2 set.
If input string is invalid, return NULL.

### example

```
mysql> select bitmap_to_string(bitmap_from_string("0, 1, 2"));
+-------------------------------------------------+
| bitmap_to_string(bitmap_from_string('0, 1, 2')) |
+-------------------------------------------------+
| 0,1,2                                           |
+-------------------------------------------------+

mysql> select bitmap_from_string("-1, 0, 1, 2");
+-----------------------------------+
| bitmap_from_string('-1, 0, 1, 2') |
+-----------------------------------+
| NULL                              |
+-----------------------------------+

mysql> select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615"));
+--------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_string('0, 1, 18446744073709551615')) |
+--------------------------------------------------------------------+
| 0,1,18446744073709551615                                           |
+--------------------------------------------------------------------+
```

### keywords

    BITMAP_FROM_STRING,BITMAP
