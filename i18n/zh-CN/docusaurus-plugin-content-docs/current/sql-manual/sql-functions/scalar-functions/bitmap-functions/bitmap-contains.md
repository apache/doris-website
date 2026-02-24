---
{
    "title": "BITMAP_CONTAINS",
    "language": "zh-CN",
    "description": "计算输入值是否在 BITMAP 中，返回值是 boolean 值。"
}
---

## 描述

计算输入值是否在 BITMAP 中，返回值是 boolean 值。

## 语法

```sql
BITMAP_CONTAINS(<bitmap>, <bigint>)
```

## 参数

| 参数         | 说明         |
|------------|------------|
| `<bitmap>` | BITMAP 集合  |
| `<bitint>` | 被判断是否存在的整数 |

## 返回值

返回一个 boolean
- 当参数存在NULL值时，返回 NULL

## 举例

```sql
select bitmap_contains(to_bitmap(1),2) cnt1, bitmap_contains(to_bitmap(1),1) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
|    0 |    1 |
+------+------+
```

```sql
select bitmap_contains(NULL,2) cnt1, bitmap_contains(to_bitmap(1),NULL) cnt2;
```

```text
+------+------+
| cnt1 | cnt2 |
+------+------+
| NULL | NULL |
+------+------+
```

