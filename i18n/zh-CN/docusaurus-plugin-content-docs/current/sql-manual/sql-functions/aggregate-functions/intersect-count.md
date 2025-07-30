---
{
"title": "INTERSECT_COUNT",
"language": "zh-CN"
}
---

## 描述

聚合函数，求 bitmap 交集大小的函数，不要求数据分布正交
第一个参数是 Bitmap 列，第二个参数是用来过滤的维度列，第三个参数是变长参数，含义是过滤维度列的不同取值。
计算 bitmap_column 中符合 column_to_filter 在 filter_values 之内的元素的交集数量，即 bitmap 交集计数。

## 语法

```sql
INTERSECT_COUNT(<bitmap_column>, <column_to_filter>, <filter_values> [, ...])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<bitmap_column>` | 输入的 bitmap 参数列 |
| `<column_to_filter>` | 是用来过滤的维度列 |
| `<filter_values>` | 是过滤维度列的不同取值 |

## 返回值

返回所求 bitmap 交集的元素数量

## 举例

```sql
select dt,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+---------------------------+
| dt   | bitmap_to_string(user_id) |
+------+---------------------------+
|    1 | 1,2                       |
|    2 | 2,3                       |
|    4 | 1,2,3,4,5                 |
|    3 | 1,2,3                     |
+------+---------------------------+
```

```sql
select intersect_count(user_id,dt,3,4) from pv_bitmap;
```

```text
+------------------------------------+
| intersect_count(user_id, dt, 3, 4) |
+------------------------------------+
|                                  3 |
+------------------------------------+
```
