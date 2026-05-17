---
{
    "title": "BITMAP_COUNT",
    "language": "zh-CN",
    "description": "计算输入 BITMAP 的元素个数"
}
---

## 描述

计算输入 BITMAP 的元素个数

## 语法

```sql
BITMAP_COUNT(<bitmap>)
```

## 参数

| 参数         | 说明         |
|------------|------------|
| `<bitmap>` | BITMAP 集合  |

## 返回值

返回一个整数

## 举例

```sql
select bitmap_count(to_bitmap(1)) cnt;
```

```text
+------+
| cnt  |
+------+
|    1 |
+------+
```

```sql
select bitmap_count(bitmap_empty()) cnt;
```

```text
+------+
| cnt  |
+------+
|    0 |
+------+
```