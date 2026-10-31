---
{
    "title": "BITMAP_CONTAINS",
    "language": "en"
}
---

## bitmap_contains
### description
#### Syntax

`BOOLEAN BITMAP_CONTAINS(BITMAP bitmap, BIGINT input)`

Calculates whether the input value is in the Bitmap column and returns a Boolean value.

### example

```
mysql> select bitmap_contains(to_bitmap(1),2) cnt;
+------+
| cnt  |
+------+
|    0 |
+------+

mysql> select bitmap_contains(to_bitmap(1),1) cnt;
+------+
| cnt  |
+------+
|    1 |
+------+
```

### keywords

    BITMAP_CONTAINS,BITMAP
