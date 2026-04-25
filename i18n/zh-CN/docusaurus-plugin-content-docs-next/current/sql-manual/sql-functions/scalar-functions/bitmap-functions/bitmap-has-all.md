---
{
    "title": "BITMAP_HAS_ALL",
    "language": "zh-CN",
    "description": "判断一个 Bitmap 是否包含另一个 Bitmap 的全部元素。"
}
---

## 描述

判断一个 Bitmap 是否包含另一个 Bitmap 的全部元素。

## 语法

```sql
bitmap_has_all(<bitmap1>, <bitmap2>)
```

## 参数

| 参数        | 描述         |
|-----------|------------|
| `<bitmap1>` | 第一个 Bitmap |
| `<bitmap2>` | 第二个 bitmap |


## 返回值

如果 `<bitmap1>` 包含 `<bitmap2>` 的全部元素，则返回 true；  
如果 `<bitmap2>` 包含的元素为空，返回 true；  
否则返回 false。
- 当参数存在NULL时，返回 NULL

## 示例

检查一个 Bitmap 是否包含另一个 Bitmap 的全部元素：

```sql
select bitmap_has_all(bitmap_from_string('0, 1, 2'), bitmap_from_string('1, 2')) res;
```

结果如下：

```text
+------+
| res  |
+------+
|    1 |
+------+
```

检查一个空 Bitmap 是否包含另一个 Bitmap 的全部元素：

```sql
select bitmap_has_all(bitmap_empty(), bitmap_from_string('1, 2')) as res;
```

结果如下：

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_has_all(bitmap_empty(), NULL) as res;
```

结果如下：

```text
+------+
| res  |
+------+
| NULL |
+------+
```
