---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "zh-CN"
}
---

## bitmap_from_base64

## 描述
## 语法

`BITMAP BITMAP_FROM_BASE64(VARCHAR input)`

将一个base64字符串(`bitmap_to_base64`函数的结果)转化为一个BITMAP。当输入字符串不合法时，返回NULL。

## 举例

```
mysql> select bitmap_to_string(bitmap_from_base64("AA=="));
+----------------------------------------------+
| bitmap_to_string(bitmap_from_base64("AA==")) |
+----------------------------------------------+
|                                              |
+----------------------------------------------+

mysql> select bitmap_to_string(bitmap_from_base64("AQEAAAA="));
+-----------------------------------+
| bitmap_to_string(bitmap_from_base64("AQEAAAA=")) |
+-----------------------------------+
| 1                                 |
+-----------------------------------+

mysql> select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y="));
+----------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) |
+----------------------------------------------------------------------------------+
| 1,9999999                                                                        |
+----------------------------------------------------------------------------------+
```

### keywords

    BITMAP_FROM_BASE64,BITMAP
