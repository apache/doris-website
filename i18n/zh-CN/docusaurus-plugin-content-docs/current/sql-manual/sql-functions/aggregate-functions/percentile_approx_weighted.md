---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

`PERCENTILE_APPROX_WEIGHTED` 函数用于计算带权重的近似百分位数，主要用于需要考虑数值重要性的场景。它是 `PERCENTILE_APPROX` 的加权版本，允许为每个值指定一个权重。

主要特点：
1. 支持权重：每个数值可以设置对应的权重，影响最终的百分位数计算
2. 内存效率：使用固定大小的内存，适合处理大规模数据
3. 精度可调：通过 compression 参数平衡精度和性能

## 语法

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要计算百分位数的列 |
| `<weight>` | 权重列，必须是正数 |
| `<p>` | 百分位数值，取值范围 `[0.0, 1.0]`，例如 `0.99` 表示 `99` 分位数 |
| `<compression>` | 可选参数，压缩度，取值范围 `[2048, 10000]`。值越大，精度越高，但内存消耗也越大。如果不指定或超出范围，则使用 `10000`。 |

## 返回值

返回一个 `DOUBLE` 类型的值，表示计算得到的加权近似百分位数。

## 举例

```sql
-- 创建示例表
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- 普通作业分数，权重1
(2, 90.0, 2),   -- 重要作业分数，权重2
(3, 75.5, 1),
(4, 95.5, 3),   -- 非常重要的作业，权重3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);

-- 计算带权重的分数分布
SELECT 
    -- 计算不同压缩度下的90分位数
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- 默认压缩度
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- 低压缩度，更快
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- 高压缩度，更精确
FROM weighted_scores;
```

```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```


