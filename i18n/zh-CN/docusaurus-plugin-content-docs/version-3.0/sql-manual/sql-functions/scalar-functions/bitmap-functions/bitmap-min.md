---
{
    "title": "BITMAP_MIN",
    "language": "zh-CN"
}
---

## 描述

计算并返回 Bitmap 中的最小值。

## 语法

```sql
bitmap_min(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

Bitmap 中的最小值。  
若 Bitmap 为空则返回 `NULL`。

## 示例

计算一个空 Bitmap 的最小值：

```sql
select bitmap_min(bitmap_from_string('')) value;
```

结果如下：

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

计算包含多个元素的 Bitmap 的最小值：

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

结果如下：

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```
