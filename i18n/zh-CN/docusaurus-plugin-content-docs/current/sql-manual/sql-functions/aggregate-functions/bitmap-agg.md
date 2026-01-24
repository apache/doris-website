---
{
    "title": "BITMAP_AGG",
    "language": "zh-CN",
    "description": "将输入的表达式聚合的非 NULL 值聚合为一个 Bitmap 。 如果某个值小于 0 或者大于 18446744073709551615，该值会被忽略，不会合并到 Bitmap 中。"
}
---

## 描述

将输入的表达式聚合的非 NULL 值聚合为一个 Bitmap 。
如果某个值小于 0 或者大于 18446744073709551615，该值会被忽略，不会合并到 Bitmap 中。

## 语法

```sql
BITMAP_AGG(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` |待合并数值的列或表达式，支持类型为 TinyInt，SmallInt，Integer，BigInt。 |

## 返回值

返回 Bitmap 类型的值。如果组内没有合法数据，则返回空 Bitmap 。

## 举例
```sql
-- setup
CREATE TABLE test_bitmap_agg (
	id INT,
	k0 INT,
	k1 INT,
	k2 INT,
	k3 INT,
	k4 BIGINT,
	k5 BIGINT
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_bitmap_agg VALUES
	(1, 10, 110, 11, 300, 10000000000, 0),
	(2, 20, 120, 21, 400, 20000000000, 200000000000000),
	(3, 30, 130, 31, 350, 30000000000, 300000000000000),
	(4, 40, 140, 41, 500, 40000000000, 18446744073709551616),
	(5, 50, 150, 51, 250, 50000000000, 18446744073709551615),
	(6, 60, 160, 61, 600, 60000000000, -1),
	(7, 60, 160, 120, 600, 60000000000, NULL);
```


```sql
select bitmap_to_string(bitmap_agg(k0)) from test_bitmap_agg;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k0)) |
+----------------------------------+
| 10,20,30,40,50,60                |
+----------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg;
```

```text
+--------------------------------------------------------+
| bitmap_to_string(bitmap_agg(k5))                       |
+--------------------------------------------------------+
| 0,200000000000000,300000000000000,18446744073709551615 |
+--------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_agg(k5)) from test_bitmap_agg where k5 is null;
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_agg(k5)) |
+----------------------------------+
|                                  |
+----------------------------------+
```
