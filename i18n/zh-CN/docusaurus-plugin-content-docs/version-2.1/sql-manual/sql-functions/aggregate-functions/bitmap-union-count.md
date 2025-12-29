---
{
    "title": "BITMAP_UNION_COUNT",
    "language": "zh-CN",
    "description": "计算输入 Bitmap 的并集，返回其基数"
}
---

## 描述

计算输入 Bitmap 的并集，返回其基数

## 语法

```sql
BITMAP_UNION_COUNT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 BITMAP 的数据类型 |

## 返回值

返回 Bitmap 并集的大小，即去重后的元素个数

## 举例

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```

计算 user_id 的去重值：

```
select bitmap_union_count(user_id) from pv_bitmap;
```

```text
+-------------------------------------+
| bitmap_count(bitmap_union(user_id)) |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```
