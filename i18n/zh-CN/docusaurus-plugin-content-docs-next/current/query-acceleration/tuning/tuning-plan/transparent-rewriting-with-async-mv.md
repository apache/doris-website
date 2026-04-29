---
{
    "title": "异步物化视图透明改写：如何加速复杂查询",
    "language": "zh-CN",
    "description": "如何使用 Doris 异步物化视图实现透明改写？本文介绍 SPJG 模式改写算法、操作示例与命中验证方法，帮助加速复杂连接与聚合查询。",
    "keywords": ["Doris 异步物化视图", "透明改写", "SPJG", "查询加速", "explain shape plan", "物化视图命中"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：复杂 JOIN/聚合查询性能优化 -->

## 一句话定义

异步物化视图透明改写是指 Doris 自动分析查询 SQL 结构，将其改写为基于已有物化视图的等价查询，从而复用预计算结果以加速查询。

## 阅读前 Checklist

- [ ] 已了解[异步物化视图](../../materialized-view/async-materialized-view/overview.md)的基本概念
- [ ] 已具备 SQL 与 EXPLAIN 使用经验
- [ ] 查询符合 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式
- [ ] 拥有创建物化视图与查询表的权限

## 概述

<!-- 知识类型：概念 -->
<!-- 适用场景：理解透明改写原理 -->

[异步物化视图](../../materialized-view/async-materialized-view/overview.md)采用基于 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式的透明改写算法。

该算法的核心能力包括：

- **结构分析**：自动解析查询 SQL 的逻辑结构。
- **视图匹配**：在已有物化视图中寻找可用候选。
- **透明改写**：在不修改原始 SQL 的前提下改写为基于物化视图的等价查询。
- **性能提升**：通过复用预计算结果显著提升查询速度并降低计算成本。

## 适用场景对比

<!-- 知识类型：决策参考 -->
<!-- 适用场景：选择是否使用透明改写 -->

| 场景特征 | 是否推荐使用透明改写 | 说明 |
| --- | --- | --- |
| 复杂 JOIN + GROUP BY 查询 | 推荐 | SPJG 模式天然契合 |
| 高频重复执行的聚合查询 | 推荐 | 预计算收益高 |
| 基表数据低频变更 | 推荐 | 维护成本低 |
| 基表数据高频变更 | 不推荐 | 物化视图刷新开销大 |
| 仅简单点查询 | 不推荐 | 预计算收益有限 |
| 存储资源紧张 | 谨慎使用 | 物化视图占用额外存储 |

## 操作示例：通过物化视图加速查询

<!-- 知识类型：操作指南 -->
<!-- 适用场景：端到端落地透明改写 -->

下面通过 TPC-H 数据集示例，端到端展示透明改写的完整流程。

### 步骤 1：创建基础表

**目的**：创建用于演示的 `orders` 与 `lineitem` 表并写入数据。

**命令**：

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

CREATE TABLE IF NOT EXISTS orders (
    o_orderkey       integer not null,
    o_custkey        integer not null,
    o_orderstatus    char(1) not null,
    o_totalprice     decimalv3(15,2) not null,
    o_orderdate      date not null,
    o_orderpriority  char(15) not null,
    o_clerk          char(15) not null,
    o_shippriority   integer not null,
    o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
)
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
PARTITION BY RANGE(l_shipdate)
(FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

**说明**：两张表均按日期分区，便于物化视图按分区刷新。

### 步骤 2：创建异步物化视图

**目的**：基于 `lineitem` 与 `orders` 创建一个预聚合的异步物化视图 `mv1`。

**命令**：

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

**关键参数**：

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `BUILD IMMEDIATE` | 立即构建 | 创建后立刻物化数据 |
| `REFRESH COMPLETE ON MANUAL` | 手动全量刷新 | 由用户触发刷新 |
| `PARTITION BY(l_shipdate)` | 按分区键分区 | 与基表分区对齐，便于增量维护 |
| `DISTRIBUTED BY RANDOM BUCKETS 2` | 随机分桶 | 简化分布配置 |

### 步骤 3：执行查询并验证透明改写

**目的**：验证查询是否被改写为基于 `mv1` 的执行计划。

**命令**：

```sql
mysql> explain shape plan SELECT l_shipdate, SUM(o_totalprice) AS total_price
    -> FROM lineitem
    -> LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    -> WHERE l_partkey = 2 AND l_suppkey = 3
    -> GROUP BY l_shipdate;
+-------------------------------------------------------------------+
| Explain String(Nereids Planner)                                   |
+-------------------------------------------------------------------+
| PhysicalResultSink                                                |
| --PhysicalDistribute[DistributionSpecGather]                      |
| ----PhysicalProject                                               |
| ------hashAgg[GLOBAL]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                  |
| ----------hashAgg[LOCAL]                                          |
| ------------PhysicalProject                                       |
| --------------filter((mv1.l_partkey = 2) and (mv1.l_suppkey = 3)) |
| ----------------PhysicalOlapScan[mv1]                             |
+-------------------------------------------------------------------+
```

**说明**：执行计划末端显示 `PhysicalOlapScan[mv1]`，表明查询已透明改写并命中 `mv1`。

### 步骤 4：查看改写状态详情

**目的**：通过 `explain` 查看更细粒度的改写状态信息。

**命令**：

```sql
| ========== MATERIALIZATIONS ==========                                            |
|                                                                                   |
| MaterializedView                                                                  |
| MaterializedViewRewriteSuccessAndChose:                                           |
|   internal.tpch.mv1 chose,                                                        |
|                                                                                   |
| MaterializedViewRewriteSuccessButNotChose:                                        |
|   not chose: none,                                                                |
|                                                                                   |
| MaterializedViewRewriteFail:                                                      |
```

**关键字段**：

| 字段 | 含义 |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | 改写成功且被优化器选用 |
| `MaterializedViewRewriteSuccessButNotChose` | 改写成功但未选用（成本不优） |
| `MaterializedViewRewriteFail` | 改写失败 |

## 使用建议

<!-- 知识类型：最佳实践 -->
<!-- 适用场景：物化视图设计与运维 -->

:::tip 使用建议

- **预计算结果**：物化视图将查询结果预先计算并存储，避免每次查询时的重复计算开销，适合频繁执行的复杂查询。
- **减少联接操作**：物化视图可将多个表的数据合并到一个视图中，减少查询时的联接操作，提高查询效率。
- **自动更新**：基表数据变化时，物化视图可自动更新，确保查询结果反映最新数据状态。
- **空间开销**：物化视图需要额外存储空间。创建时需在查询性能与存储成本之间权衡。
- **维护成本**：物化视图的维护需消耗系统资源。基表更新频繁时刷新开销大，应选择合适的刷新策略。
- **适用场景**：物化视图适用于数据低频变化、查询高频的场景；对高频变化的数据，实时计算可能更合适。

:::

## FAQ 与 Troubleshooting

<!-- 知识类型：常见问题 -->
<!-- 适用场景：排查改写未命中、性能不如预期 -->

### Q1：查询未命中物化视图怎么办？

按以下顺序排查：

1. 通过 `explain` 查看 `MATERIALIZATIONS` 段是否有 `RewriteFail` 信息。
2. 确认查询符合 SPJG（SELECT-PROJECT-JOIN-GROUP-BY）模式。
3. 检查物化视图字段是否覆盖查询所需列。
4. 检查物化视图状态是否为可用（已构建、未失效）。

### Q2：改写成功但未被选用是什么原因？

`MaterializedViewRewriteSuccessButNotChose` 表示优化器认为改写后的成本高于原计划。可尝试：

- 调整物化视图分区与分桶策略。
- 通过统计信息收集（`ANALYZE`）让优化器拿到准确的成本估算。

### Q3：物化视图刷新太慢怎么办？

- 优先使用增量刷新替代全量刷新。
- 让物化视图分区键与基表分区键对齐，按分区刷新。
- 评估基表写入频率，避免在高峰期触发刷新。

### Q4：如何确认改写是否命中？

执行 `EXPLAIN` 或 `EXPLAIN SHAPE PLAN`，查看：

- 计划中是否出现 `PhysicalOlapScan[mv 名称]`。
- `MATERIALIZATIONS` 段中 `RewriteSuccessAndChose` 是否包含目标物化视图。

### 常见错误关键词

- `MaterializedViewRewriteFail`：改写失败，常见于 SQL 不符合 SPJG 模式或字段缺失。
- `not chose`：改写成功但未选用，通常是成本估算问题。
- `MV is not in NORMAL state`：物化视图状态异常，需检查刷新历史。

## 总结

合理使用异步物化视图，可显著改善复杂连接与大数据量聚合查询的性能。落地时需综合考虑存储成本、刷新开销与数据时效性，以实现性能与成本的平衡。
