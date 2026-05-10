---
{
    "title": "BITMAP_NOT",
    "language": "zh-CN",
    "description": "计算第一个 Bitmap 减去第二个 Bitmap 之后的集合，并返回为新的 Bitmap。"
}
---

## 描述

计算第一个 Bitmap 减去第二个 Bitmap 之后的集合，并返回为新的 Bitmap。

## 语法

```sql
bitmap_not(<bitmap1>, <bitmap2>)
```

## 参数

| 参数        | 描述         |
|-----------|------------|
| `<bitmap1>` | 第一个 Bitmap |
| `<bitmap2>` | 第二个 Bitmap |

## 返回值

`<bitmap1>` 减去 `<bitmap2>` 后集合的 Bitmap。
- 当参数存在NULL时，返回 NULL

## 示例

计算两个 Bitmap 之间的差集：

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) as res;
```

结果如下，因 `<bitmap1>` 的所有元素也在 `<bitmap2>` 中，所以结果是一个空的 Bitmap：

```text
+------+
| res  |
+------+
|      |
+------+
```

计算 `<bitmap1>` 中存在但 `<bitmap2>` 中不存在的元素的差集：

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), bitmap_from_string('1,2,3,4'))) as res;
```

结果如下，将是一个包含元素 `5` 的 Bitmap：

```text
+------+
| res  |
+------+
| 5    |
+------+
```

```sql
select bitmap_to_string(bitmap_not(bitmap_from_string('2,3,5'), NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
