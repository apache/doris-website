---
{
    "title": "BITMAP_AND_COUNT",
    "language": "zh-CN",
    "description": "计算两个及以上输入 BITMAP 的交集，返回交集的个数。"
}
---

## 描述

计算两个及以上输入 BITMAP 的交集，返回交集的个数。

## 语法

```sql
BITMAP_AND_COUNT(<bitmap>, <bitmap>,[, <bitmap>...])
```

## 参数

| 参数         | 说明               |
|------------|------------------|
| `<bitmap>` | 被求交集的原 BITMAP 之一 |

## 返回值

返回整数
- 当参数存在NULL时，返回 0

## 举例

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    1 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')) as res;
```

```text
+------+
| res  |
+------+
|    2 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

```sql
select bitmap_and_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL) as res;
```

```text
+------+
| res  |
+------+
|    0 |
+------+
```

