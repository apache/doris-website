---
{
    "title": "BITMAP_EMPTY",
    "language": "en"
}
---

## bitmap_empty
### description
#### Syntax

`BITMAP BITMAP_EMPTY()`

Return an empty bitmap. Mainly be used to supply default value for bitmap column when loading, e.g.,

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://host:8410/api/test/testDb/_stream_load
```

### example

```
mysql> select bitmap_count(bitmap_empty());
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+

mysql> select bitmap_to_string(bitmap_empty());
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

### keywords

    BITMAP_EMPTY,BITMAP
