---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
    "language": "zh-CN",
    "description": "PERCENTILEAPPROXWEIGHTED 函数用于计算带权重的近似百分位数，主要用于需要考虑数值重要性的场景。它是 PERCENTILEAPPROX 的加权版本，允许为每个值指定一个权重。"
}
---

## 描述

`PERCENTILE_APPROX_WEIGHTED` 函数用于计算带权重的近似百分位数，主要用于需要考虑数值重要性的场景。它是 `PERCENTILE_APPROX` 的加权版本，允许为每个值指定一个权重。

主要特点：
1. 支持权重：每个数值可以设置对应的权重，影响最终的百分位数计算
2. 内存效率：使用固定大小的内存，适合处理低基数大规模数据
3. 精度可调：通过 compression 参数平衡精度和性能

## 语法

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要计算百分位数的列，支持类型为 Double 。 |
| `<weight>` | 权重列，必须是正数，支持类型为 Double 。 |
| `<p>` | 百分位数值，支持类型为 Double 。取值范围 `[0.0, 1.0]`，例如 `0.99` 表示 `99` 分位数 |
| `<compression>` | 可选参数，支持类型为 Double 。表示压缩度，取值范围 `[2048, 10000]`。值越大，精度越高，但内存消耗也越大。如果不指定或超出范围，则使用 `10000`。 |

## 返回值

返回一个 Double 类型的值，表示计算得到的加权近似百分位数。
如果组内没有合法数据，则返回 NULL 。

## 举例

```sql
-- setup
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- 普通作业分数，权重 1
(2, 90.0, 2),   -- 重要作业分数，权重 2
(3, 75.5, 1),
(4, 95.5, 3),   -- 非常重要的作业，权重 3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);
```

```sql
SELECT 
    -- 计算不同压缩度下的 90 分位数
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- 默认压缩度
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- 低压缩度，更快
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- 高压缩度，更精确
FROM weighted_scores;
```

计算带权重的分数分布。

```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```

```sql
select percentile_approx_weighted(if(score>95,score,null), weight, 0.9) from weighted_scores;
```

只会计算输入的非 NULL 的数据。

```text
+------------------------------------------------------------------+
| percentile_approx_weighted(if(score>95,score,null), weight, 0.9) |
+------------------------------------------------------------------+
|                                                             95.5 |
+------------------------------------------------------------------+
```

```sql
select percentile_approx_weighted(score, weight, 0.9, null) from weighted_scores;
```

如果输入数据均为 NULL，则返回NULL。

```text
+------------------------------------------------------+
| percentile_approx_weighted(score, weight, 0.9, null) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```