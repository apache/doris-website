---
{
    "title": "BITMAP_HAS_ANY",
    "language": "zh-CN"
}
---

## 描述

计算两个 Bitmap 是否存在相交元素。

## 语法

```sql
bitmap_has_any(<bitmap1>, <bitmap2>)
```

## 参数

| 参数        | 描述         |
|-----------|------------|
| `<bitmap1>` | 第一个 Bitmap |
| `<bitmap2>` | 第二个 Bitmap |

## 返回值

如果两个 Bitmap 存在相同元素，返回 true；  
如果两个 Bitmap 不存在相同元素，返回 false。

## 示例

检查一个 Bitmap 是否包含另一个 Bitmap 的任意元素：

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(2));
```

结果如下：

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+
```

检查一个 Bitmap 是否包含自身的任意元素：

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(1));
```

结果如下：

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
