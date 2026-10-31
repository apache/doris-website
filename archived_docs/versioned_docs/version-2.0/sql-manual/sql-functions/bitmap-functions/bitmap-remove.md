---
{
    "title": "BITMAP_REMOVE",
    "language": "en"
}
---

## bitmap_remove
### description
#### Syntax

`BITMAP BITMAP_REMOVE(BITMAP bitmap, BIGINT input)`

Remove the specified value from bitmap.

### example

```
mysql [(none)]>select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res; 
+------+
| res  |
+------+
| 1,2  |
+------+

mysql [(none)]>select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
+------+
| res  |
+------+
| NULL |
+------+
```

### keywords

    BITMAP_REMOVE,BITMAP
