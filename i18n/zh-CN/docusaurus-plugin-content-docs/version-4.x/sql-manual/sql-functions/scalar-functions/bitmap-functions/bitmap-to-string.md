---
{
    "title": "BITMAP_TO_STRING",
    "language": "zh-CN",
    "description": "将一个 Bitmap 转化成一个逗号分隔的字符串，字符串中包含所有设置的 Bit 位。"
}
---

## 描述

将一个 Bitmap 转化成一个逗号分隔的字符串，字符串中包含所有设置的 Bit 位。

## 语法

```sql
bitmap_to_string(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

包含 Bitmap 所有 Bit 位的字符串，以逗号分隔。  
若 Bitmap 为 `NULL` 时，返回值为 `NULL`。

## 示例

将 `NULL` Bitmap 转换为字符串：

```sql
select bitmap_to_string(null);
```

结果如下：

```text
+------------------------+
| bitmap_to_string(NULL) |
+------------------------+
| NULL                   |
+------------------------+
```

将空 Bitmap 转换为字符串：

```sql
select bitmap_to_string(bitmap_empty());
```

结果如下：

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

将包含单个元素的 Bitmap 转换为字符串：

```sql
select bitmap_to_string(to_bitmap(1));
```

结果如下：

```text
+--------------------------------+
| bitmap_to_string(to_bitmap(1)) |
+--------------------------------+
| 1                              |
+--------------------------------+
```

将包含多个元素的 Bitmap 转换为字符串：

```sql
select bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2)));
```

结果如下：

```text
+---------------------------------------------------------+
| bitmap_to_string(bitmap_or(to_bitmap(1), to_bitmap(2))) |
+---------------------------------------------------------+
| 1,2                                                     |
+---------------------------------------------------------+
```
