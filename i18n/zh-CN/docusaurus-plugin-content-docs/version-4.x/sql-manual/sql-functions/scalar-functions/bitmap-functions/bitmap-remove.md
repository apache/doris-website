---
{
    "title": "BITMAP_REMOVE",
    "language": "zh-CN",
    "description": "从 Bitmap 列中删除指定的值。"
}
---

## 描述

从 Bitmap 列中删除指定的值。

## 语法

```sql
bitmap_remove(<bitmap>, <value>)
```

## 参数

| 参数        | 描述       |
|-----------|----------|
| `<bitmap>` | Bitmap 值 |
| `<value>` | 要删除的值    |

## 返回值

删除后的 Bitmap。  

若要删除的值不存在，则返回原 Bitmap；  
若要删除的值为 `NULL`, 则返回 `NULL`。

## 示例

从 Bitmap 中移除一个值：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), 3)) res;
```

结果如下：

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

从 Bitmap 中移除一个 `NULL` 值：

```sql
select bitmap_to_string(bitmap_remove(bitmap_from_string('1, 2, 3'), null)) res;
```

结果如下：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
