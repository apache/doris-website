---
{
    "title": "BITMAP_TO_BASE64",
    "language": "zh-CN",
    "description": "将一个 Bitmap 转化成一个 Base64 编码后的字符串。"
}
---

## 描述

将一个 Bitmap 转化成一个 Base64 编码后的字符串。

## 语法

```sql
bitmap_to_base64(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

Bitmap 基于 Base64 编码后的字符串。  
若 Bitmap 为 `NULL` 时，返回值为 `NULL`。

::: note

BE 配置项 `enable_set_in_bitmap_value` 会改变 bitmap 值在内存中的具体格式，因此会影响此函数的结果。  
由于不能保证 bitmap 中元素的顺序，因此不能保证相同内容的 bitmap 生成的 base64 结果始终相同，但可以保证 bitmap_from_base64 解码后的 bitmap 相同。

:::

## 示例

将 `NULL` Bitmap 转换为 Base64 字符串：

```sql
select bitmap_to_base64(null);
```

结果如下：

```text
+------------------------+
| bitmap_to_base64(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

将空 Bitmap 转换为 Base64 字符串：

```sql
select bitmap_to_base64(bitmap_empty());
```

结果如下：

```text
+----------------------------------+
| bitmap_to_base64(bitmap_empty()) |
+----------------------------------+
| AA==                             |
+----------------------------------+
```

将包含单个元素的 Bitmap 转换为 Base64 字符串：

```sql
select bitmap_to_base64(to_bitmap(1));
```

结果如下：

```text
+--------------------------------+
| bitmap_to_base64(to_bitmap(1)) |
+--------------------------------+
| AQEAAAA=                       |
+--------------------------------+
```

将包含多个元素的 Bitmap 转换为 Base64 字符串：

```sql
select bitmap_to_base64(bitmap_from_string("1,9999999"));
```

结果如下：

```text
+---------------------------------------------------------+
| bitmap_to_base64(bitmap_from_string("1,9999999"))       |
+---------------------------------------------------------+
| AjowAAACAAAAAAAAAJgAAAAYAAAAGgAAAAEAf5Y=                |
+---------------------------------------------------------+
```
