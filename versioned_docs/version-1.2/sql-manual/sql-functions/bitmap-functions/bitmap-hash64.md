---
{
    "title": "BITMAP_HASH64",
    "language": "en"
}
---

## bitmap_hash64
### description
#### Syntax

`BITMAP BITMAP_HASH64(expr)`

Compute the 64-bits hash value of a expr of any type, then return a bitmap containing that hash value. Mainly be used to load non-integer value into bitmap column, e.g.,

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,device_id, device_id=bitmap_hash64(device_id)"   http://host:8410/api/test/testDb/_stream_load
```

### example

```
mysql> select bitmap_to_string(bitmap_hash64('hello'));
+------------------------------------------+
| bitmap_to_string(bitmap_hash64('hello')) |
+------------------------------------------+
| 15231136565543391023                     |
+------------------------------------------+
```

### keywords

    BITMAP_HASH,BITMAP
