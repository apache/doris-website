---
{
    "title": "TO_BITMAP",
    "language": "en"
}
---

## to_bitmap
### description
#### Syntax

`BITMAP TO_BITMAP(expr)`

Convert an unsigned bigint (ranging from 0 to 18446744073709551615) to a bitmap containing that value. 
Null will be return when the input value is not in this range.
Mainly be used to load integer value into bitmap column, e.g.,

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,user_id, user_id=to_bitmap(user_id)"   http://host:8410/api/test/testDb/_stream_load
```

### example

```
mysql> select bitmap_count(to_bitmap(10));
+-----------------------------+
| bitmap_count(to_bitmap(10)) |
+-----------------------------+
|                           1 |
+-----------------------------+

MySQL> select bitmap_to_string(to_bitmap(-1));
+---------------------------------+
| bitmap_to_string(to_bitmap(-1)) |
+---------------------------------+
|                                 |
+---------------------------------+
```

### keywords

    TO_BITMAP,BITMAP
