---
{
    "title": "BITMAP_NOT",
    "language": "en"
}
---

## bitmap_not
### description
#### Syntax

`BITMAP BITMAP_NOT(BITMAP lhs, BITMAP rhs)`

Calculate the set after lhs minus rhs, return the new bitmap.

### example

```
mysql> select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
|                                                                                        |
+----------------------------------------------------------------------------------------+

mysql> select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'),bitmap_from_string('1,2,3,4')));
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 5                                                                                      |
+----------------------------------------------------------------------------------------+
```

### keywords

    BITMAP_NOT,BITMAP
