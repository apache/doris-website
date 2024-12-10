---
{
    "title": "使用分区裁剪优化扫表",
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

## 工作原理

Doris 作为一款高性能实时分析数据库，提供了强大的分区裁剪（Partition Pruning）功能，可以显著提升查询性能。分区裁剪是一种查询优化技术，它通过分析查询条件，智能识别与查询相关的分区，并仅扫描这些分区的数据，从而避免了对无关分区的不必要扫描。这种优化方式能够大幅减少 I/O 操作和计算量，进而加速查询执行。

## 调优案例

下面，我们通过一个实际案例来演示 Doris 的分区裁剪功能。

假设有一个销售数据表 `sales`，该表按照日期进行分区，每天的数据存储在一个独立的分区中。表结构定义如下：

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

现在，我们需要查询 2023 年 1 月 15 日到 2023 年 2 月 15 日之间的销售总额。查询语句如下：

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

对于上述查询，Doris 的分区裁剪优化过程如下：

1. Doris 智能分析查询条件中的分区列 `date`，识别出查询的日期范围在 '2023-01-15' 到 '2023-02-15' 之间。

2. 通过比较查询条件与分区定义，Doris 精确定位需要扫描的分区范围。在本例中，只需要扫描分区 `p2` 和 `p3`，因为这两个分区的日期范围完全覆盖了查询条件。

3. Doris 自动跳过与查询条件无关的分区，如 `p1` 和 `p4`，避免了不必要的数据扫描，从而减少了 I/O 开销。

4. 最后，Doris 仅在分区 `p2` 和 `p3` 中执行数据扫描和聚合计算，快速获取查询结果。

通过 `EXPLAIN` 命令，我们可以查看查询执行计划，确认 Doris 的分区裁剪优化已生效。在执行计划中，`OlapScanNode` 节点的 `partition` 属性将显示实际扫描的分区为 `p2` 和 `p3`。

```sql
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |                                     |
```

## 总结

综上所述，Doris 的分区裁剪功能可以智能识别查询条件与分区之间的关联性，自动裁剪无关分区，仅扫描必要的数据，显著提升查询性能。合理利用分区裁剪特性，可以帮助用户构建高效的实时分析系统，轻松应对海量数据的查询需求。