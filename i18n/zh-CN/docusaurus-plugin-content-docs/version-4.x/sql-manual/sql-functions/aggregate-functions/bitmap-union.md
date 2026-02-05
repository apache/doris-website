---
{
    "title": "BITMAP_UNION",
    "language": "zh-CN",
    "description": "计算输入 Bitmap 的并集，返回新的 bitmap。"
}
---

## 描述

计算输入 Bitmap 的并集，返回新的 bitmap。

## 语法

```sql
BITMAP_UNION(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 Bitmap 的数据类型 |

## 返回值

返回值的数据类型为 Bitmap。
当组内没有合法数据时，返回空 Bitmap。

## 举例

```sql
-- setup
CREATE TABLE pv_bitmap (
  dt INT,
  page INT,
  user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
  (1, 100, to_bitmap(100)),
  (1, 100, to_bitmap(200)),
  (1, 100, to_bitmap(300)),
  (2, 200, to_bitmap(300));
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
| 100,200,300                             |
+-----------------------------------------+
```

```sql
select bitmap_to_string(bitmap_union(user_id)) from pv_bitmap where user_id is null;
```

```text
+-----------------------------------------+
| bitmap_to_string(bitmap_union(user_id)) |
+-----------------------------------------+
|                                         |
+-----------------------------------------+
```
