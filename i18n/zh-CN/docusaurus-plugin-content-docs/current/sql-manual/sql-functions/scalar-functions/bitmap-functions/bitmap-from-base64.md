---
{
    "title": "BITMAP_FROM_BASE64",
    "language": "zh-CN",
    "description": "将 bitmap_to_base64 生成的 base64 字符串还原为一个 BITMAP。当输入字符串不合法时返回 NULL；若输入是原始二进制字节，请改用 bitmap_from_binary。"
}
---

## 描述

将一个 base64 字符串（可以由 `bitmap_to_base64` 函数转换来）转化为一个 BITMAP。当输入字符串不合法时，返回 NULL。

:::note

本函数期望输入 Base64 **文本**。Hive `binary` 等外部二进制列会映射为 `VARBINARY` 并保存原始序列化字节，`bitmap_from_base64` 在其上会返回 NULL。这类列请使用 [`bitmap_from_binary`](bitmap-from-binary)，或先用 `from_base64` 将文本解码为字节。

:::

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
