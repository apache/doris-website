---
{
    "title": "BITMAP_MAX",
    "language": "en"
}
---

## bitmap_max
### description
#### Syntax

`BIGINT BITMAP_MAX(BITMAP input)`

Calculate and return the max values of a bitmap.

### example

```
mysql> select bitmap_max(bitmap_from_string('')) value;
+-------+
| value |
+-------+
|  NULL |
+-------+

mysql> select bitmap_max(bitmap_from_string('1,9999999999')) value;
+------------+
| value      |
+------------+
| 9999999999 |
+------------+
```

### keywords

    BITMAP_MAX,BITMAP
