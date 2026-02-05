---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "zh-CN",
    "description": "将一个 base64 字符串（可以由 bitmaptobase64 函数转换来）转化为一个 BITMAP。当输入字符串不合法时，返回 NULL。"
}
---

## 描述

将一个 base64 字符串（可以由 `bitmap_to_base64` 函数转换来）转化为一个 BITMAP。当输入字符串不合法时，返回 NULL。

## 语法

```sql
 BITMAP_FROM_BASE64(<base64_str>)
```

## 参数

| 参数             | 说明                                     |
|----------------|----------------------------------------|
| `<base64_str>` | base64 字符串 (可以由`bitmap_to_base64`函数转换来) |

## 返回值

返回一个 BITMAP
- 当输入字段不合法时，结果返回 NULL

## 举例

```sql
select bitmap_to_string(bitmap_from_base64("invalid")) bts;
```

```text
+------+
| bts  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AA==")) bts;
```

```text
+------+
| bts  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AQEAAAA=")) bts;
```

```text
+------+
| bts  |
+------+
| 1    |
+------+
```

```sql
select bitmap_to_string(bitmap_from_base64("AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=")) bts;
```

```text
+-----------+
| bts       |
+-----------+
| 1,9999999 |
+-----------+
```
