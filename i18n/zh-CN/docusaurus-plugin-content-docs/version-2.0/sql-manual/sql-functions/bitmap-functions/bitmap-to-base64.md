---
{
    "title": "BITMAP_TO_BASE64",
    "language": "zh-CN"
}
---

## bitmap_to_base64

## 描述
## 语法

`VARCHAR BITMAP_TO_BASE64(BITMAP input)`

将一个bitmap转化成一个base64字符串。输入是null的话返回null。BE配置项`enable_set_in_bitmap_value`会改变bitmap值在内存中的具体格式，因此会影响此函数的结果。

## 举例

```
mysql> select bitmap_to_base64(null);
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+

mysql> select bitmap_to_base64(bitmap_empty());
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+

mysql> select bitmap_to_base64(to_bitmap(1));
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| AQEAAAA=                       |
+--------------------------------+

mysql> select bitmap_to_base64(bitmap_from_string("1,9999999"));
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+

```

### keywords

    BITMAP_TO_BASE64,BITMAP
