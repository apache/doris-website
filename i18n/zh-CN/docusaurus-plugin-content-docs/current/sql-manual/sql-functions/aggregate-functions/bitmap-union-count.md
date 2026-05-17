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
| `<expr>` | 支持 Bitmap 的数据类型 |

## 返回值

返回 Bitmap 并集的大小，即去重后的元素个数。
组内没有合法数据时，返回 0 。

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
select bitmap_union_count(user_id) from pv_bitmap;
```

计算 user_id 的去重值个数。

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           3 |
+-----------------------------+
```

```sql
select bitmap_union_count(user_id) from pv_bitmap where user_id is null;
```

```text
+-----------------------------+
| bitmap_union_count(user_id) |
+-----------------------------+
|                           0 |
+-----------------------------+
```

