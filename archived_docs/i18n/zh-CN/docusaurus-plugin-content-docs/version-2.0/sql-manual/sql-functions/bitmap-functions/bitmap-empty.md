---
{
    "title": "BITMAP_EMPTY",
    "language": "zh-CN"
}
---

## bitmap_empty
## 描述
## 语法

`BITMAP BITMAP_EMPTY()`

返回一个空bitmap。主要用于 insert 或 stream load 时填充默认值。例如

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://host:8410/api/test/testDb/_stream_load
```

## 举例

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
