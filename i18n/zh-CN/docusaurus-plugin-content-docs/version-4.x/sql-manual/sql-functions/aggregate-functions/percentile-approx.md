---
{
    "title": "PERCENTILE_APPROX",
    "language": "zh-CN",
    "description": "PERCENTILEAPPROX 函数用于计算近似百分位数，主要用于大数据集的场景。与 PERCENTILE 函数相比，它具有以下特点："
}
---

## 描述

`PERCENTILE_APPROX` 函数用于计算近似百分位数，主要用于大数据集的场景。与 `PERCENTILE` 函数相比，它具有以下特点：

1. 内存效率：使用固定大小的内存，即使在处理低基数列（数据量很大但不同元素数很少）时也能保持较低的内存消耗
2. 性能优势：适合处理低基数大规模数据集，计算速度快
3. 精度可调：通过 compression 参数可以在精度和性能之间做平衡

## 语法

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要计算百分位数的列，支持类型：Double。 |
| `<p>` | 百分位数，常量，支持类型为 Double，取值范围 `[0.0, 1.0]`，如 `0.99` 表示 99 分位。必须为常量。 |
| `<compression>` | 可选，压缩度，支持类型为 Double，取值范围 `[2048, 10000]`。值越大精度越高但内存消耗也越大。未指定或超出范围时默认 `10000`。 |

## 返回值

返回指定列的近似百分位数，类型为 Double。
如果组内没有合法数据，则返回 NULL。

## 举例

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);
```

```sql
-- 使用不同压缩度计算 99 分位数
SELECT 
    percentile_approx(response_time, 0.99) as p99_default,          -- 默认压缩度
    percentile_approx(response_time, 0.99, 2048) as p99_fast,       -- 低压缩度，更快
    percentile_approx(response_time, 0.99, 10000) as p99_accurate   -- 高压缩度，更精确
FROM response_times;
```

```text
+-------------------+-------------------+-------------------+
| p99_default       | p99_fast          | p99_accurate      |
+-------------------+-------------------+-------------------+
| 100.5999984741211 | 100.5999984741211 | 100.5999984741211 |
+-------------------+-------------------+-------------------+
```

```sql
SELECT percentile_approx(if(response_time>90,response_time,NULL), 0.5) FROM response_times;
```

只计算非 NULL 数据。

```text
+-----------------------------------------------------------------+
| percentile_approx(if(response_time>90,response_time,NULL), 0.5) |
+-----------------------------------------------------------------+
|                                               100.5999984741211 |
+-----------------------------------------------------------------+
```

```sql
SELECT percentile_approx(NULL, 0.99) FROM response_times;
```

输入数据均为 NULL 时返回 NULL。

```text
+-------------------------------+
| percentile_approx(NULL, 0.99)  |
+-------------------------------+
|                          NULL  |
+-------------------------------+
```


