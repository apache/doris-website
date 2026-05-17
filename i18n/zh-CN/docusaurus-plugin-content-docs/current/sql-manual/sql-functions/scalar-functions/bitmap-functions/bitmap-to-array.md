---
{
    "title": "BITMAP_TO_ARRAY",
    "language": "zh-CN",
    "description": "将一个 Bitmap 转化成一个 Array 数组。"
}
---

## 描述

将一个 Bitmap 转化成一个 Array 数组。

## 语法

```sql
bitmap_to_array(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

Bitmap 所有 Bit 位构成的的数组。  
若 Bitmap 为 `NULL` 则返回 `NULL`。

## 示例

将 `NULL` Bitmap 转换为数组：

```sql
select bitmap_to_array(null);
```

结果如下：

```text
+------------------------+
| bitmap_to_array(NULL)  |
+------------------------+
| NULL                   |
+------------------------+
```

将空 Bitmap 转换为数组：

```sql
select bitmap_to_array(bitmap_empty());
```

结果如下：

```text
+---------------------------------+
| bitmap_to_array(bitmap_empty()) |
+---------------------------------+
| []                              |
+---------------------------------+
```

将包含单个元素的 Bitmap 转换为数组：

```sql
select bitmap_to_array(to_bitmap(1));
```

结果如下：

```text
+-------------------------------+
| bitmap_to_array(to_bitmap(1)) |
+-------------------------------+
| [1]                           |
+-------------------------------+
```

将包含多个元素的 Bitmap 转换为数组：

```sql
select bitmap_to_array(bitmap_from_string('1,2,3,4,5'));
```

结果如下：

```text
+--------------------------------------------------+
| bitmap_to_array(bitmap_from_string('1,2,3,4,5')) |
+--------------------------------------------------+
| [1, 2, 3, 4, 5]                                  |
+--------------------------------------------------+
```
