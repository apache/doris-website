---
{
    "title": "INTERSECT_COUNT",
    "language": "zh-CN",
    "description": "INTERSECTCOUNT 函数用于计算 Bitmap 数据结构的交集元素的数量。"
}
---

## 描述

INTERSECT_COUNT 函数用于计算 Bitmap 数据结构的交集元素的数量。

## 语法

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<bitmap_column>` | 需要获取第一个值的表达式 |
| `<column_to_filter>` | 可选。需要进行过滤的维度列 |
| `<filter_values>` | 可选。过滤维度列的不同取值 |

## 返回值

返回 BIGINT 类型的值。

## 举例

```sql
-- setup
create table pv_bitmap(dt int, user_id bitmap bitmap_union) aggregate key(dt) distributed by hash(dt) buckets 1 properties ("replication_num"="1");
insert into pv_bitmap values (4,bitmap_from_string('1,2,3')),(3,bitmap_from_string('1,2,3,4,5'));
```

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap where dt in (3,4);
```

```text
+------+-----------------------------+
| dt   | bitmap_to_string(`user_id`) |
+------+-----------------------------+
| 4    | 1,2,3                       |
| 3    | 1,2,3,4,5                   |
+------+-----------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+----------------------------------------+
| intersect_count(`user_id`, `dt`, 3, 4) |
+----------------------------------------+
|                                      3 |
+----------------------------------------+
```
