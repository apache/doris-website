---
{
    "title": "EXPONENTIAL_MOVING_AVERAGE",
    "language": "zh-CN",
    "description": "计算时间序列的指数平滑移动平均值，使用给定的半衰期参数控制权重衰减速度。"
}
---

## 描述

计算基于时间索引的指数平滑移动平均值。`half_decay` 参数控制半衰期：过去数据的指数权重衰减一半所需的时间单位数。

指数移动平均对近期观测值赋予更高权重，权重随时间差呈指数衰减。该函数特别适用于平滑含噪声的时间序列数据和检测趋势。

算法原理：

- 每个值的权重为 `2^(-dt / half_decay)`，其中 `dt` 是该值与最新时间点之间的时间差。
- 结果为加权和除以单位间隔假设下的权重和：`1 / (1 - 2^(-1 / half_decay))`。
- 该函数满足交换律和结合律，适用于分布式聚合场景。

## 语法

```sql
EXPONENTIAL_MOVING_AVERAGE(<half_decay>, <value>, <timeunit>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<half_decay>` | 半衰期，必须为常量数值表达式。支持类型为 DOUBLE。 |
| `<value>` | 要进行平均计算的数值列。支持类型为 DOUBLE。 |
| `<timeunit>` | 数值型时间索引（不是原始时间戳）。对于时间戳列，使用 `intDiv(toUnixTimestamp(ts), interval_seconds)` 进行转换。支持类型为 DOUBLE。 |

## 返回值

返回 DOUBLE 类型的指数平滑移动平均值。特殊情况：

- 如果 `half_decay` 为 0，返回 0。
- 如果 `<value>` 或 `<timeunit>` 包含 NULL，则该行被排除。
- 如果组内没有有效数据，返回 NULL。

## 示例

### 基本用法

计算温度读数随时间变化的指数移动平均：

```sql
-- 准备数据
create table temparature_data (
    id int,
    temp double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into temparature_data values
    (1, 10, 1),
    (2, 20, 2),
    (3, 30, 3);
```

```sql
select exponential_moving_average(2.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(2.0, temp, ts) |
+----------------------------------------------------+
|                                  14.39339828220178 |
+----------------------------------------------------+
```

### 半衰期影响

half_decay 越小，近期值的权重越大：

```sql
-- 使用相同数据，但 half_decay=1
select exponential_moving_average(1.0, temp, ts) from temparature_data;
```

```text
+----------------------------------------------------+
| exponential_moving_average(1.0, temp, ts) |
+----------------------------------------------------+
|                                              21.25 |
+----------------------------------------------------+
```

### GROUP BY 分组使用

```sql
-- 准备数据
create table sensor_data (
    sensor_id int,
    reading double,
    ts double
) distributed by hash (sensor_id) buckets 1
properties ("replication_num"="1");

insert into sensor_data values
    (1, 10, 1),
    (1, 20, 2),
    (2, 100, 1),
    (2, 200, 2);
```

```sql
select sensor_id, exponential_moving_average(1.0, reading, ts)
from sensor_data group by sensor_id order by sensor_id;
```

```text
+-----------+-------------------------------------------------------+
| sensor_id | exponential_moving_average(1.0, reading, ts) |
+-----------+-------------------------------------------------------+
|         1 |                                                  12.5 |
|         2 |                                                   125 |
+-----------+-------------------------------------------------------+
```

### NULL 值处理

包含 NULL 的行会被跳过。

```sql
-- 准备数据
create table null_test (
    id int,
    val double,
    ts double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into null_test values
    (1, 10, 1),
    (2, null, 2),
    (3, 20, 3);
```

```sql
select exponential_moving_average(1.0, val, ts) from null_test;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            11.25 |
+-------------------------------------------------+
```

### 空结果集

当结果集为空时，返回 NULL。

```sql
select exponential_moving_average(1.0, val, ts) from null_test where val > 100;
```

```text
+-------------------------------------------------+
| exponential_moving_average(1.0, val, ts) |
+-------------------------------------------------+
|                                            NULL |
+-------------------------------------------------+
```

### 窗口函数使用

```sql
-- 准备数据
create table time_series (
    ts double,
    val double
) distributed by hash (ts) buckets 1
properties ("replication_num"="1");

insert into time_series values (0, 10), (1, 10), (2, 10);
```

```sql
select
    ts,
    exponential_moving_average(1.0, val, ts)
        over (order by ts rows between unbounded preceding and current row) as ema
from time_series order by ts;
```

```text
+------+-------+
| ts   | ema   |
+------+-------+
|    0 |     5 |
|    1 |   7.5 |
|    2 |  8.75 |
+------+-------+
```

### 常量要求

`half_decay` 参数必须为常量。传入列表达式会导致错误：

```sql
-- 以下语句将报错：half_decay 必须为常量
select exponential_moving_average(val, val, ts) from temparature_data;
```
