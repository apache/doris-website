---
{
    "title": "BITMAP_HAS_ANY",
    "language": "zh-CN",
    "description": "计算两个 Bitmap 是否存在相交元素。"
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
- 当参数存在NULL时，返回 NULL

## 示例

检查一个 Bitmap 是否包含另一个 Bitmap 的任意元素：

```sql
select bitmap_has_any(to_bitmap(1), to_bitmap(2)) as res;
```

结果如下：

```text
+------+
| res  |
+------+
|    0 |
+------+
```

检查一个 Bitmap 是否包含自身的任意元素：

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), to_bitmap(1)) as res;
```

结果如下：

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_has_any(bitmap_from_string('1,2,3'), NULL) as res;
```

结果如下：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
