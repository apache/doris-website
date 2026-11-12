---
{
    "title": "BITMAP_HAS_ALL",
    "language": "en"
}
---

## bitmap_has_all
### description
#### Syntax

`BOOLEAN BITMAP_HAS_ALL(BITMAP lhs, BITMAP rhs)`

Returns true if the first bitmap contains all the elements of the second bitmap.
Returns true if the second bitmap contains an empty element.

### example

```
mysql> select bitmap_has_all(bitmap_from_string("0, 1, 2"), bitmap_from_string("1, 2"));
+---------------------------------------------------------------------------+
| bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) |
+---------------------------------------------------------------------------+
|                                                                         1 |
+---------------------------------------------------------------------------+

mysql> select bitmap_has_all(bitmap_empty(), bitmap_from_string("1, 2"));
+------------------------------------------------------------+
| bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) |
+------------------------------------------------------------+
|                                                          0 |
+------------------------------------------------------------+
```

### keywords

    BITMAP_HAS_ALL,BITMAP
