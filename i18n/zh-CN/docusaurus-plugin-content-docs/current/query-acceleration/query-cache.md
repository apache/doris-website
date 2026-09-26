---
title: Query Cache 查询缓存使用指南
description: 如何用 Apache Doris Query Cache 加速重复聚合查询？本文讲解原理、配置参数、命中条件、失效机制与常见问题排查。
keywords:
    - Doris Query Cache
    - 查询缓存
    - 聚合查询加速
    - Tablet 缓存
    - LRU-K
    - 缓存命中率
    - 流水线执行引擎
language: zh-CN
---

<!-- 知识类型：概念 + 操作 + 故障排查 -->
<!-- 适用场景：仪表板/BI/T+1 报表中的重复聚合查询加速 -->

# Query Cache（查询缓存）

Query Cache 是 Apache Doris 流水线执行引擎中按 Tablet 粒度缓存中间聚合结果的机制，用于加速重复的聚合查询。

## 阅读前 Checklist

<!-- 知识类型：前置检查 -->
<!-- 适用场景：判断当前查询是否可使用 Query Cache -->

在使用 Query Cache 前，请确认：

-   [ ] 查询的是 **内部 OLAP 表**（非 Hive/JDBC/Iceberg/Hudi/Paimon 等外部表）
-   [ ] 查询是 **聚合查询**（包含 `GROUP BY` 或聚合函数）
-   [ ] 查询计划符合 `AggregationNode → OlapScanNode` 模式
-   [ ] 查询不包含 `JOIN`、`SORT`、`UNION`、`WINDOW` 节点
-   [ ] 查询不依赖 `now()`、`rand()`、`uuid()` 等非确定性函数
-   [ ] 已设置 `enable_query_cache = true`

## 一句话定义

<!-- 知识类型：概念定义 -->

Query Cache 在流水线执行引擎中按 Tablet 粒度缓存聚合结果，当后续查询的执行上下文相同时直接返回缓存数据，避免重复扫描和重复计算。

## 为什么需要 Query Cache

<!-- 知识类型：背景 -->
<!-- 适用场景：仪表板/报表反复执行相同聚合 SQL -->

在分析型场景中，同一聚合查询经常被重复执行，但底层数据并未变化。例如：

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

每次执行都会重新扫描相同 Tablet 并重新计算，浪费 CPU 与 I/O。Query Cache 缓存中间聚合结果，命中后直接返回，大幅降低延迟。

:::caution 重要限制
-   仅适用于 **内部 OLAP 表上的聚合查询**。普通扫描、JOIN、排序等不会使用 Query Cache。
-   **不支持外部表**（Hive、JDBC、Iceberg、Hudi、Paimon 等）。
:::

## 工作原理

<!-- 知识类型：原理 -->
<!-- 适用场景：理解命中条件与失效机制 -->

### 支持的查询模式

只有执行计划树（Plan Tree）匹配以下模式的 Fragment 才有资格使用缓存：

-   `AggregationNode → OlapScanNode`：直接在扫描上进行的单阶段聚合。
-   `AggregationNode → AggregationNode → OlapScanNode`：在扫描上进行的两阶段聚合。

聚合节点和扫描节点之间允许存在 `FilterNode` 和 `ProjectNode` 等中间节点。但缓存子树中 **不能** 包含 `JoinNode`、`SortNode`、`UnionNode`、`WindowNode` 或 `ExchangeNode`。

### 缓存键的三个组成部分

| 组成部分        | 说明                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL 摘要        | 基于归一化执行计划树（聚合函数、分组表达式、非分区过滤谓词、投影列、影响结果的 Session 变量）计算的 SHA-256 哈希。语义相同的查询会得到相同摘要 |
| Tablet ID 列表  | 分配给当前 Pipeline 实例的、排序后的 Tablet ID 列表                                                                                           |
| Tablet 范围     | 每个 Tablet 的有效扫描范围，由分区谓词推导而来（详见[分区与过滤行为](#分区与过滤行为)）                                                       |

### 缓存失效条件

| 触发条件     | 说明                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| 数据变更     | INSERT、DELETE、UPDATE 或 Compaction 使 Tablet 版本号递增；后续查询比对版本，不一致即未命中。开启[增量合并](#增量合并实验性)后，版本落后的条目可改为只扫增量而被复用 |
| Schema 变更  | ALTER TABLE 改变表结构，从而改变执行计划与摘要                                                        |
| LRU 淘汰     | 缓存内存超限时，按 LRU-K（K=2）淘汰；新条目须至少被访问两次才能被准入                                 |
| 过期清理     | 超过 24 小时的条目由周期性清理任务自动移除                                                            |
| 强制刷新     | 设置 `query_cache_force_refresh = true` 时忽略缓存并重新执行                                          |

### 执行流程

**首次执行（缓存未命中）：**

1.  扫描算子正常从 Tablet 中读取数据。
2.  聚合算子计算结果。
3.  结果发送给下游消费者，同时累积以准备写入缓存。
4.  执行完成后，若累积结果未超过单条目大小/行数限制，结果将被写入缓存。

**后续执行（缓存命中）：**

1.  扫描算子检测到缓存命中，跳过扫描范围——不读取任何 Tablet 数据。
2.  聚合算子无输入，无输出。
3.  缓存源算子直接提供缓存的数据块。
4.  若列顺序与缓存条目不同（例如 `SELECT a, b` 与 `SELECT b, a` 摘要相同），列会被自动重新排列。

## 分区与过滤行为

<!-- 知识类型：原理 -->
<!-- 适用场景：理解如何提高跨查询的缓存命中率 -->

理解分区谓词与过滤表达式如何与 Query Cache 交互，对获得高命中率至关重要。

### 单列 RANGE 分区谓词

对于 **单列 RANGE 分区** 表，分区谓词会被特殊处理：

-   分区谓词从摘要中 **被提取出来**；系统会计算谓词范围与每个分区实际范围边界的交集，作为 Tablet 范围字符串附加到缓存键中。
-   两个仅在分区过滤范围上有差异的查询，可在共同 Tablet 上 **共享缓存**。

**示例**：表 `orders` 按 `dt` 列每日分区。

```sql
-- 查询 A
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-01' AND dt < '2024-01-03' GROUP BY region;

-- 查询 B
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-02' AND dt < '2024-01-04' GROUP BY region;
```

-   查询 A 扫描分区 `2024-01-01`、`2024-01-02`。
-   查询 B 扫描分区 `2024-01-02`、`2024-01-03`。
-   分区 `2024-01-02` 的 Tablet 摘要与范围相同，因此 **查询 B 复用查询 A 在 `2024-01-02` 的缓存**，仅需重新计算 `2024-01-03` 分区。

### 多列 RANGE / LIST / 未分区表

对于 **多列 RANGE 分区**、**LIST 分区** 或 **未分区** 的表，分区谓词无法被提取，会被直接包含在摘要中。即使分区谓词只有微小差异，也会产生不同摘要并导致缓存未命中。

### 非分区过滤表达式

非分区过滤表达式（如 `WHERE status = 'active'`）会被包含在归一化的执行计划摘要中。仅当两个查询的过滤表达式归一化后语义完全相同时，才能共享缓存。

| 查询 1                                              | 查询 2                                              | 是否共享缓存             |
| --------------------------------------------------- | --------------------------------------------------- | ------------------------ |
| `WHERE status = 'active'`                           | `WHERE status = 'active'`                           | 是（相同摘要）           |
| `WHERE status = 'active'`                           | `WHERE status = 'inactive'`                         | 否（不同摘要）           |
| `WHERE status = 'active' AND region = 'ASIA'`       | `WHERE region = 'ASIA' AND status = 'active'`       | 是（归一化后顺序无关）   |

### Session 变量

影响查询结果的 Session 变量（如 `time_zone`、`sql_mode`、`sql_select_limit`）会被包含在摘要中。在两次查询之间更改任一变量都会产生不同缓存键并导致未命中。

### 导致 Query Cache 被禁用的条件

<!-- 知识类型：故障排查 -->
<!-- 适用场景：缓存未生效的原因排查 -->

| 条件                                                          | 原因                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Fragment 是 Runtime Filter 的目标                             | Runtime Filter 值在规划时未知，缓存会产生错误结果                          |
| 包含非确定性表达式（`rand()`、`now()`、`uuid()`、UDF 等）     | 即使输入相同，结果也会因执行次数不同而变化                                 |
| 缓存子树中包含 JOIN、SORT、UNION 或 WINDOW 节点               | 仅支持「聚合-扫描」模式                                                    |
| 扫描节点不是 `OlapScanNode`（例如外部表扫描）                 | 缓存依赖 Tablet ID 与版本，外部表不存在这些概念                            |

## Query Cache 不支持外部表的原因

<!-- 知识类型：FAQ -->
<!-- 适用场景：用户希望对 Hive/Iceberg 等使用缓存 -->

Query Cache 依赖内部 OLAP 表的三个特有属性：

1.  **基于 Tablet 的数据组织**：缓存键包含 Tablet ID 和每个 Tablet 的扫描范围；外部表存储在 HDFS、S3、JDBC 等外部系统中，没有 Tablet 概念。
2.  **基于版本的失效机制**：每个内部 Tablet 都有单调递增的版本号，缓存以此检测过期；外部表不向 Doris 暴露此版本机制。
3.  **OlapScanNode 要求**：执行计划归一化逻辑只识别 `OlapScanNode` 作为聚合缓存点下方的有效扫描节点。

外部表的缓存需求请改用 [SQL Cache](./sql-cache-manual.md)。

## 增量合并（实验性）

<!-- 知识类型：原理 + 操作 -->
<!-- 适用场景：小时级批量导入不断写入热分区，导致其缓存条目反复失效 -->

默认情况下，版本落后的缓存条目（例如按小时导入的表的当前分区）会被直接作废，对应的 Pipeline 实例回到全量扫描重算。开启**增量合并**后，BE 会复用这条过期条目：只扫描 `(缓存版本, 当前版本]` 区间的增量 rowset，把增量的聚合中间状态与缓存的中间状态**并排**交给上游合并聚合（两者本就是同构的可合并输入），并以新版本回写合并后的条目。对小时级导入场景，热分区的扫描成本从“每小时扫整个分区”降为“只扫最近一小时的新数据”。

![全量重算与增量合并对比](/images/next/query-cache/incremental-merge-architecture.svg)

```sql
SET enable_query_cache = true;
SET enable_query_cache_incremental = true;  -- SHOW VARIABLES 中显示为 experimental_enable_query_cache_incremental
```

### 生效前提

增量合并仅在**同时**满足以下条件时生效；任一不满足都会静默回退为全量重算，查询结果始终正确：

1. 被扫描的索引（基表或选中的 rollup）为**追加写**模型：**DUP_KEYS** 表，或增量窗口内未改写既有主键的**写时合并（merge-on-write）UNIQUE_KEYS** 表。对写时合并表，BE 会按 tablet 检查 `(cached_version, current_version]` 窗口内的 delete bitmap：窗口内只新增了全新主键（主键表上常见的“每小时追加导入”模式）即可增量合并；一旦有 upsert、部分列更新或 delete sign 命中了更早的主键，则回退一次全量重算，重算会以新版本重建条目，下一次纯追加导入即恢复增量。读时合并（merge-on-read）UNIQUE 表在读取时跨 rowset 归并去重、AGG 表在存储层合并行，“缓存快照 + 增量 = 新快照”不成立；聚合物化视图同理被拒绝。
2. 缓存点是**直接位于扫描之上、且不做 finalize 的聚合**（常见的两阶段聚合形态，例如按非分桶列 `GROUP BY`）。单阶段聚合与嵌套聚合缓存点会被拒绝。
3. tablet 视图可同步到查询版本。存算一体形态下天然满足；**存算分离（cloud）**形态下，逐 tablet 的判定会先把本地视图（rowset 列表，merge-on-write 表还包括 delete bitmap）同步到查询版本，这通常没有额外代价（视图已新鲜时是空操作，否则只是把扫描阶段本来就要做的同步提前执行）；同步失败，或同步耗时超过一个短的快速失败预算（`query_cache_decision_sync_timeout_ms`，BE 配置，防止慢的 meta service 长时间占住决策所在的准入线程），则回退为一次全量重算。
4. 增量版本路径仍可捕获（未被 compaction 合并跨界），且增量中**不含 DELETE 谓词**（增量中的删除会逻辑上移除已折入缓存块的行，无法通过合并撤销）。

写时合并表的 delete bitmap 窗口检查方式如下：

![写时合并表的 delete bitmap 窗口检查](/images/next/query-cache/incremental-merge-mow-bitmap.svg)

:::note
存算分离（cloud）形态下，有两个以版本精确性换取速度的会话变量：`query_freshness_tolerance_ms` 允许扫描停在低于查询版本的已预热版本上，`enable_prefer_cached_rowset` 允许扫描沿已预热的 rowset 布局读取；两者的版本走线都可能越过查询版本（一个跨越查询版本的已预热 compaction rowset 会把路径带到其后）。开启任一变量的查询因此可能读取版本不精确的视图，所以不走增量合并：增量捕获必须精确对准查询版本，这与两个开关的目的相悖。此外（这一点与增量合并无关），BE 在存算分离形态下也不会把这类查询的结果写回 Query Cache，保证缓存中不会出现内容与版本戳不符的条目；这类查询仍可消费由普通查询灌入的精确命中（HIT）条目。增量合并的排除本身在所有部署形态下都生效（有意做成与形态无关的门禁）；存算一体形态下这两个变量本身不生效，因此这只是让一个开启了 cloud 专属开关的查询放弃增量优化，两种形态下结果都正确。
:::

### 增量部分的合并

每次增量合并都会把增量块追加进条目，条目随之逐渐碎片化。当条目累计 `query_cache_max_incremental_merge_count` 次合并（BE 配置，默认 `8`，运行时可调）后，下一次查询会强制全量重算，条目自然压实。

单个实例内的增量执行数据流（含回写与两道熵控制）：

![单实例内的增量执行数据流](/images/next/query-cache/incremental-merge-dataflow.svg)

### 可观测性

- CACHE_SOURCE 算子的查询 profile：`HitCacheStale = 1` 表示走了增量合并；`IncrementalDeltaVersions` 展示增量区间（如 `(100, 114514]`）；过期条目未能复用时，`IncrementalFallbackReason` 给出原因（`delta versions not capturable`、`delta contains delete predicates`、`delta rewrites history rows`、`keys type not append-only`、`cloud rowset sync failed`、`cloud rowset sync timed out` 等）。
- BE 指标：`doris_be_query_cache_stale_hit_total`、`doris_be_query_cache_incremental_fallback_total`、`doris_be_query_cache_write_back_total`、`doris_be_query_cache_decision_sync_time_ms`（仅在存算分离形态下增长：增量判定在捕获增量前把 tablet 视图同步到查询版本所花费的累计耗时）。

BE 如何在 HIT、INCREMENTAL、MISS 三态间决策，以及每种回退原因的来源：

![决策流程与主要回退原因](/images/next/query-cache/incremental-merge-decision-flow.svg)

从 FE 授权到存储层防线的全景视图：

![增量合并全景：FE、BE 与存储层](/images/next/query-cache/incremental-merge-overview.svg)

## 配置参数

<!-- 知识类型：参数参考 -->
<!-- 适用场景：调优缓存大小与单条目限制 -->

### Session 变量（FE）

| 参数                          | 说明                                                                                       | 默认值              |
| ----------------------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| `enable_query_cache`          | 启用或禁用 Query Cache 的总开关                                                            | `false`             |
| `query_cache_force_refresh`   | 设为 `true` 时忽略缓存结果并重新执行查询；新结果仍会写入缓存                               | `false`             |
| `query_cache_entry_max_bytes` | 单个缓存条目的最大字节数；超过该限制的 Fragment 结果不会被缓存                             | `5242880`（5 MB）   |
| `query_cache_entry_max_rows`  | 单个缓存条目的最大行数；超过该限制的 Fragment 结果不会被缓存                               | `500000`            |
| `enable_query_cache_incremental` | （实验性）允许 BE 以增量合并方式复用过期缓存条目：只扫描缓存版本之后的增量 rowset，并与缓存的聚合中间结果一起交给上游合并。详见[增量合并](#增量合并实验性) | `false` |

### BE 配置（be.conf）

| 参数               | 说明                                       | 默认值 |
| ------------------ | ------------------------------------------ | ------ |
| `query_cache_size` | 每个 BE 上 Query Cache 的总内存容量（MB）  | `512`  |
| `query_cache_max_incremental_merge_count` | 单个缓存条目上累计增量合并的最大次数，达到后强制一次全量重算以压实条目；设为 `0` 可在运行时禁用增量合并 | `8` |
| `query_cache_decision_sync_timeout_ms` | （仅 cloud 存算分离模式）增量合并判定在捕获增量前，把每个 tablet 视图同步到查询版本的快速失败预算（毫秒）；同步未在此预算内完成则该查询回退为一次全量重算。设为 `<= 0` 时任何未完成的同步都会回退，即禁用 cloud 增量合并。运行时可调。 | `2000` |

:::note
`be.conf` 中的 `query_cache_max_size_mb` 和 `query_cache_elasticity_size_mb` 控制的是旧版 SQL Result Cache，**不是** 本文描述的流水线级别 Query Cache，请勿混淆。
:::

## 使用示例

<!-- 知识类型：操作 -->
<!-- 适用场景：开启、验证、强制刷新缓存 -->

### 步骤 1：开启 Query Cache

**目的**：启用 Query Cache 总开关。

```sql
SET enable_query_cache = true;
```

**说明**：该变量为 Session 级，需要在每个连接中开启；可在 FE 全局变量中设置默认值。

### 步骤 2：执行典型聚合查询

**目的**：触发缓存写入与读取。

```sql
-- 第一次执行：缓存未命中，计算结果并写入缓存
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;

-- 第二次执行：缓存命中，直接从缓存返回结果
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;
```

**说明**：第二次执行的 SQL 摘要、Tablet ID 列表和 Tablet 范围与第一次完全一致，因此命中缓存。

### 步骤 3：通过 Profile 验证命中

**目的**：确认查询是否真的使用了缓存。

执行查询后查看 Profile，定位 `CacheSourceOperator` 部分：

| Profile 字段                              | 含义                              |
| ----------------------------------------- | --------------------------------- |
| `HitCache: true`                          | 查询从缓存中获取了结果            |
| `HitCache: false`，`InsertCache: true`    | 未命中，但成功将结果写入缓存      |
| `HitCache: false`，`InsertCache: false`   | 未命中，且结果过大无法缓存        |
| `CacheTabletId`                           | 缓存涉及的 Tablet ID              |

### 步骤 4：强制刷新缓存

**目的**：忽略已有缓存并重算结果（如怀疑缓存数据异常）。

```sql
-- 强制下一次查询跳过缓存并重新计算结果
SET query_cache_force_refresh = true;

SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-15' GROUP BY region;

-- 重置
SET query_cache_force_refresh = false;
```

**说明**：强制刷新后新结果仍会写入缓存。

## 适用场景对比

<!-- 知识类型：决策 -->
<!-- 适用场景：判断 Query Cache 是否值得开启 -->

| 场景                                       | 是否适用 | 原因                                                  |
| ------------------------------------------ | -------- | ----------------------------------------------------- |
| 仪表板/BI 工具反复执行相同聚合 SQL         | 适用     | 摘要与 Tablet 完全一致，命中率高                      |
| T+1 报表（数据每天加载一次）               | 适用     | 当天后续查询可命中缓存                                |
| 重叠日期范围的聚合查询                     | 适用     | 单列 RANGE 分区可在 Tablet 级别共享缓存条目           |
| 普通 SELECT 扫描、JOIN、排序、窗口函数     | 不适用   | 仅支持「聚合-扫描」模式                               |
| 外部表（Hive、JDBC、Iceberg、Hudi、Paimon）| 不适用   | 无 Tablet 与版本机制；建议改用 SQL Cache              |
| 频繁更新的表                               | 不适用   | Tablet 版本快速变化，命中率低                         |
| 含 `now()`/`rand()`/`uuid()`/UDF 的查询    | 不适用   | 非确定性结果，缓存被禁用                              |
| 依赖 Runtime Filter 的查询                 | 不适用   | Runtime Filter 值在规划时未知                         |

## 注意事项

<!-- 知识类型：限制 -->

-   **缓存非持久化**：Query Cache 驻留在 BE 内存中，BE 重启后缓存被清空。
-   **内存消耗**：缓存数据块占用 BE 内存，请监控内存并按需调整 `query_cache_size`。
-   **LRU-K 准入机制**：缓存已满时，新条目须至少被访问两次才能被准入（K=2），可防止低频查询污染缓存。

## 故障排查（Troubleshooting）

<!-- 知识类型：故障排查 -->
<!-- 适用场景：缓存未命中或未写入的常见原因 -->

| 现象                                       | 可能原因                                                            | 解决方案                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `HitCache: false` 持续出现                 | 未开启 `enable_query_cache`                                         | `SET enable_query_cache = true`                                        |
| `HitCache: false`，`InsertCache: false`    | 单条目结果过大，超过 `query_cache_entry_max_bytes` 或 `_max_rows`   | 增大对应阈值或增加过滤条件减少结果                                     |
| 计划中找不到 `CacheSourceOperator`         | 计划包含 JOIN/SORT/UNION/WINDOW，或为 Runtime Filter 目标           | 改写 SQL 使其匹配「聚合-扫描」模式                                     |
| 表是外部表                                 | Query Cache 不支持外部表                                            | 使用 [SQL Cache](./sql-cache-manual.md)                                |
| 数据未变化但仍未命中                       | Schema 变更、Session 变量变化、`query_cache_force_refresh = true`   | 检查 ALTER 历史、对比 Session 变量、重置 `query_cache_force_refresh`   |
| 缓存命中率很低                             | Tablet 频繁更新或 Compaction 频繁                                   | 调整写入频率，或对低更新表启用                                         |
| BE 内存压力升高                            | `query_cache_size` 设置过大                                         | 降低 `query_cache_size` 并重启 BE                                      |

## FAQ

<!-- 知识类型：FAQ -->

**Q1：Query Cache 与 SQL Cache 有何区别？**

| 维度       | Query Cache                            | SQL Cache                                |
| ---------- | -------------------------------------- | ---------------------------------------- |
| 缓存粒度   | Tablet 粒度的中间聚合结果              | 整条 SQL 的最终结果                      |
| 适用查询   | 仅内部 OLAP 表的聚合查询               | 任意查询（含外部表）                     |
| 共享能力   | 不同 SQL 可在 Tablet 级别共享缓存      | 仅完全相同的 SQL 文本可命中              |
| 失效机制   | Tablet 版本号变化即失效                | 基于分区版本或时间                       |

**Q2：开启后会立刻命中缓存吗？**

不会。第一次执行属于「缓存未命中、写入缓存」；从第二次起才有可能命中。此外 LRU-K（K=2）要求新条目至少被访问两次才会被真正准入。

**Q3：可以缓存涉及 JOIN 的聚合吗？**

要看聚合相对 JOIN 的位置。若聚合直接位于 JOIN 之上（缓存子树里含 `JoinNode`），该 Fragment 不缓存，且与 runtime filter 无关。但若改写为**先聚合再 JOIN**（把聚合下推到各表扫描之上），每张表按 Tablet 的聚合就能各自作为缓存点。这里还有一层独立的限制：JOIN 会向探测侧扫描下发 runtime filter，使该侧 Fragment 无法缓存，因此 runtime filter 开启时只有 Build 侧命中；要让参与 JOIN 的各表都命中缓存，需同时设置 `runtime_filter_mode=OFF`。也可改用物化视图。

**Q4：BE 重启后需要预热吗？**

需要。Query Cache 是内存缓存，重启后清空；可在低峰期主动跑一遍核心聚合 SQL 进行预热。

**Q5：怎样确认是否真的命中？**

执行 SQL 后查看 Profile 中 `CacheSourceOperator` 的 `HitCache` 字段。

## 总结

<!-- 知识类型：总结 -->

Query Cache 是 Doris 流水线级别的优化机制，按 Tablet 粒度缓存中间聚合结果。其核心特点：

-   **仅适用于** 内部 OLAP 表上的 **聚合查询**。
-   基于 Tablet 版本自动进行缓存失效。
-   智能地将分区谓词从摘要中分离，使分区范围重叠的查询可共享缓存。
-   提供单条目大小与行数限制，避免过大结果消耗缓存内存。
-   使用 LRU-K（K=2）淘汰策略维护高质量缓存。
