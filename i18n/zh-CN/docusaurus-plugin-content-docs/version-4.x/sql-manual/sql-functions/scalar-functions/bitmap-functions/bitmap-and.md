---
{
    "title": "BITMAP_AND",
    "language": "zh-CN",
    "description": "计算两个及以上输入的 BITMAP 的交集，返回新的 BITMAP."
}
---

## 描述

计算两个及以上输入的 BITMAP 的交集，返回新的 BITMAP.

## 语法

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## 参数

| 参数         | 说明               |
|------------|------------------|
| `<bitmap>` | 被求交集的原 BITMAP 之一 |

## 返回值

返回一个 BITMAP  
- 当参数存在NULL时，返回 NULL

## 举例

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) as res;
```

```text
+------+
| res  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty())) as res;
```

```text
+------+
| res  |
+------+
|      |
+------+
```

```sql
select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```


