---
{
    "title": "INTERSECT_COUNT",
    "language": "zh-CN",
    "description": "聚合函数，求 bitmap 交集大小的函数。 第一个参数是 Bitmap 列，第二个参数是用来过滤的维度列，第三个参数是变长参数，含义是过滤维度列的不同取值。 计算 bitmapcolumn 中符合 columntofilter 在 filtervalues 之内的元素的交集数量，"
}
---

## 描述

聚合函数，求 bitmap 交集大小的函数。
第一个参数是 Bitmap 列，第二个参数是用来过滤的维度列，第三个参数是变长参数，含义是过滤维度列的不同取值。
计算 bitmap_column 中符合 column_to_filter 在 filter_values 之内的元素的交集数量，即 bitmap 交集计数。
对于 filter_values 相同的数据，取它们 bitmap 的并集，最终对每个 filter_values 的并集 bitmap 求交集。

## 语法

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<bitmap_column>` | 输入的 bitmap 参数列 |
| `<column_to_filter>` | 是用来过滤的维度列，支持类型为 TinyInt，SmallInt，Integer，BigInt，LargeInt。 |
| `<filter_values>` | 是过滤维度列的不同取值，TinyInt，SmallInt，Integer，BigInt，LargeInt。 |

## 返回值

返回所求 bitmap 交集的元素数量

## 举例

```sql
-- setup
CREATE TABLE pv_bitmap (
	dt INT,
	user_id BITMAP,
	city STRING
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
	(20250801, to_bitmap(1), 'beijing'),
	(20250801, to_bitmap(2), 'beijing'),
	(20250801, to_bitmap(3), 'shanghai'),
	(20250802, to_bitmap(3), 'beijing'),
	(20250802, to_bitmap(4), 'shanghai'),
	(20250802, to_bitmap(5), 'shenzhen');
```

```sql
select intersect_count(user_id,dt,20250801) from pv_bitmap;
```

```text
+--------------------------------------+
| intersect_count(user_id,dt,20250801) |
+--------------------------------------+
|                                    3 |
+--------------------------------------+
```

```sql
select intersect_count(user_id,dt,20250801,20250802) from pv_bitmap;
```

```text
+-----------------------------------------------+
| intersect_count(user_id,dt,20250801,20250802) |
+-----------------------------------------------+
|                                             1 |
+-----------------------------------------------+
```
