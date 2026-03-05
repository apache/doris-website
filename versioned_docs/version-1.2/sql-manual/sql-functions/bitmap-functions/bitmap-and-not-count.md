---
{
    "title": "BITMAP_AND_NOT_COUNT",
    "language": "en"
}
---

## bitmap_and_not_count
### description
#### Syntax

`BITMAP BITMAP_AND_NOT_COUNT(BITMAP lhs, BITMAP rhs)`

Calculate the set after lhs minus intersection of two input bitmaps, return the new bitmap size.


### example

```
mysql> select bitmap_and_not_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) cnt;
+------+
| cnt  |
+------+
|    2 |
+------+
```

### keywords

    BITMAP_AND_NOT_COUNT,BITMAP
