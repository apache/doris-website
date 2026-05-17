---
{
    "title": "GROUP_BITMAP_XOR",
    "language": "zh-CN",
    "description": "主要用于合并多个 bitmap 的值，并对结果进行按位 xor 计算"
}
---

## 描述

主要用于合并多个 bitmap 的值，并对结果进行按位 xor 计算

## 语法

```sql
GROUP_BITMAP_XOR(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 bitmap 的数据类型 |

## 返回值

返回值的数据类型为 BITMAP。
当组内没有合法数据时，返回 NULL 。

## 举例

```sql
-- setup
CREATE TABLE pv_bitmap (
	page varchar(10),
	user_id BITMAP
) DISTRIBUTED BY HASH(page) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	('m', to_bitmap(4)),
	('m', to_bitmap(7)),
	('m', to_bitmap(8)),
	('m', to_bitmap(1)),
	('m', to_bitmap(3)),
	('m', to_bitmap(6)),
	('m', to_bitmap(15)),
	('m', to_bitmap(4)),
	('m', to_bitmap(7));
```

```sql
select page, bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap group by page;
```

```text
+------+---------------------------------------------+
| page | bitmap_to_string(group_bitmap_xor(user_id)) |
+------+---------------------------------------------+
| m    | 1,3,6,8,15                                  |
+------+---------------------------------------------+
```


```sql
select bitmap_to_string(group_bitmap_xor(user_id)) from pv_bitmap where page is null;
```

```text
+---------------------------------------------+
| bitmap_to_string(group_bitmap_xor(user_id)) |
+---------------------------------------------+
| NULL                                        |
+---------------------------------------------+
```
