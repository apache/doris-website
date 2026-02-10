---
{
    "title": "BITMAP_MIN",
    "language": "en"
}
---

## bitmap_min
### description
#### Syntax

`BIGINT BITMAP_MIN(BITMAP input)`

Calculate and return the min values of a bitmap.

### example

```
mysql> select bitmap_min(bitmap_from_string('')) value;
+-------+
| value |
+-------+
|  NULL |
+-------+

mysql> select bitmap_min(bitmap_from_string('1,9999999999')) value;
+-------+
| value |
+-------+
|     1 |
+-------+
```

### keywords

    BITMAP_MIN,BITMAP
