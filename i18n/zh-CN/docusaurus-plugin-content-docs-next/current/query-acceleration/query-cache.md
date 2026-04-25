---
{
    "title": "Query Cache",
    "language": "zh-CN"
}
---

# Query Cache（查询缓存）

## 概述

在分析型查询场景中，同一个聚合查询经常会被重复执行，而底层数据并未发生变化。例如：

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

每次执行都会重新扫描相同的 Tablet 并重新计算完全相同的聚合结果，浪费了大量的 CPU 和 I/O 资源。

为了解决这一问题，Apache Doris 提供了 **Query Cache** 机制。它缓存流水线执行引擎中产生的中间聚合结果，当后续查询具有相同的执行上下文时，直接返回缓存的结果，从而大幅降低查询延迟。

:::caution 重要限制
- Query Cache **仅适用于**内部 OLAP 表上的**聚合查询**。非聚合查询（普通扫描、JOIN、排序等）不会使用 Query Cache。
- Query Cache **不支持外部表**（Hive、JDBC、Iceberg、Hudi、Paimon 等）。
:::

## 工作原理

### 支持的查询模式

Query Cache 专为聚合查询设计。具体来说，只有执行计划树（Plan Tree）匹配以下模式的 Fragment 才有资格使用缓存：

- `AggregationNode → OlapScanNode`（直接在扫描上进行的单阶段聚合）
- `AggregationNode → AggregationNode → OlapScanNode`（在扫描上进行的两阶段聚合）

聚合节点和扫描节点之间允许存在 `FilterNode` 和 `ProjectNode` 等中间节点。但是，缓存子树中**不能**包含 `JoinNode`、`SortNode`、`UnionNode`、`WindowNode` 或 `ExchangeNode`。

### 缓存键

缓存键由三部分组成：

1. **SQL 摘要** — 基于归一化后的执行计划树（聚合函数、分组表达式、非分区过滤谓词、投影列以及影响结果的 Session 变量）计算得到的 SHA-256 哈希值。归一化过程会为所有内部标识符分配规范化的 ID，因此两个语义相同的查询即使内部计划节点或 Slot ID 不同，也会产生相同的摘要。

2. **Tablet ID 列表** — 分配给当前 Pipeline 实例的排序后的 Tablet ID 列表。

3. **Tablet 范围** — 每个 Tablet 的有效扫描范围，由分区谓词推导而来（详见[分区与过滤行为](#分区与过滤行为)）。

### 缓存失效

缓存条目在以下任何情况发生时失效：

- **数据变更**：INSERT、DELETE、UPDATE 或 Compaction 操作导致 Tablet 版本号递增。后续查询时系统会将 Tablet 的当前版本与缓存版本进行比较，版本不匹配即缓存未命中。
- **Schema 变更**：ALTER TABLE 操作改变了表结构，从而改变了执行计划和摘要。
- **LRU 淘汰**：当缓存内存超过配置上限时，最近最少使用的条目会被淘汰。缓存使用 LRU-K（K=2）算法——当缓存已满时，新条目必须至少被访问两次才能被准入缓存。
- **过期清理**：超过 24 小时的条目会被周期性清理任务自动移除。
- **强制刷新**：当设置 `query_cache_force_refresh = true` 时，缓存结果将被忽略，查询重新执行。

### 执行流程

**首次执行（缓存未命中）**：

1. 扫描算子正常从 Tablet 中读取数据。
2. 聚合算子计算结果。
3. 结果发送给下游消费者，同时累积以准备写入缓存。
4. 执行完成后，如果累积结果未超过单条目的大小/行数限制，结果将被写入缓存。

**后续执行（缓存命中）**：

1. 扫描算子检测到缓存命中，跳过添加任何扫描范围——不读取任何 Tablet 数据。
2. 聚合算子不产生输出（没有输入数据）。
3. 缓存源算子直接提供缓存的数据块。
4. 如果列顺序与缓存条目不同（例如 `SELECT a, b` 与 `SELECT b, a` 具有相同摘要），列会被自动重新排列。

## 分区与过滤行为

理解分区谓词和过滤表达式如何与 Query Cache 交互，对于获得良好的缓存命中率至关重要。

### 分区谓词

对于使用**单列 RANGE 分区**的表，分区谓词会被特殊处理：

- 分区谓词被**从摘要中提取出来**。取而代之的是，系统会计算谓词范围与每个分区实际范围边界的交集，并将其作为 Tablet 范围字符串附加到缓存键中。
- 这意味着两个仅在分区过滤范围上有差异的查询，可以在共同的 Tablet 上共享缓存条目。

**示例：**

假设表 `orders` 按 `dt` 列进行每日分区：

```sql
-- 查询 A
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-01' AND dt < '2024-01-03' GROUP BY region;

-- 查询 B
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-02' AND dt < '2024-01-04' GROUP BY region;
```

- 查询 A 扫描分区 `2024-01-01` 和 `2024-01-02` 的 Tablet。
- 查询 B 扫描分区 `2024-01-02` 和 `2024-01-03` 的 Tablet。
- 分区 `2024-01-02` 的 Tablet 具有相同的摘要和相同的 Tablet 范围，因此**查询 B 可以复用查询 A 在 `2024-01-02` 分区上的缓存**，只需要重新计算 `2024-01-03` 分区的数据。

对于**多列 RANGE 分区**、**LIST 分区**或**未分区**的表，分区谓词无法被提取，会被直接包含在摘要中。在这种情况下，即使分区谓词只有微小差异，也会产生不同的摘要导致缓存未命中。

### 非分区过滤表达式

非分区过滤表达式（例如 `WHERE status = 'active'`）会被包含在归一化的执行计划摘要中。只有当两个查询的非分区过滤表达式在归一化后语义完全相同时，它们才能共享缓存条目。

- `WHERE status = 'active'` 和 `WHERE status = 'active'` — 相同摘要，缓存命中。
- `WHERE status = 'active'` 和 `WHERE status = 'inactive'` — 不同摘要，缓存未命中。
- `WHERE status = 'active' AND region = 'ASIA'` 和 `WHERE region = 'ASIA' AND status = 'active'` — 归一化过程会对条件进行排序，因此它们会产生相同的摘要，可以命中缓存。

### Session 变量

影响查询结果的 Session 变量（如 `time_zone`、`sql_mode`、`sql_select_limit` 等）会被包含在摘要中。在两次查询之间更改这些变量中的任何一个，都会产生不同的缓存键，导致缓存未命中。

### 导致 Query Cache 被禁用的条件

以下条件会导致规划器对某个 Fragment 完全跳过 Query Cache：

| 条件 | 原因 |
|------|------|
| Fragment 是 Runtime Filter 的目标 | Runtime Filter 的值是动态的，在规划时未知；缓存会产生错误结果 |
| 包含非确定性表达式（`rand()`、`now()`、`uuid()`、UDF 等） | 即使输入相同，结果也会因执行次数不同而变化 |
| 缓存子树中包含 JOIN、SORT、UNION 或 WINDOW 节点 | 仅支持聚合-扫描模式 |
| 扫描节点不是 `OlapScanNode`（例如外部表扫描） | 缓存依赖于 Tablet ID 和版本，外部表不存在这些概念 |

## Query Cache 不支持外部表的原因

Query Cache 依赖于内部 OLAP 表的三个特有属性：

1. **基于 Tablet 的数据组织** — 缓存键包含 Tablet ID 和每个 Tablet 的扫描范围。外部表将数据存储在外部系统（HDFS、S3、JDBC 等）中，没有 Tablet 概念。

2. **基于版本的失效机制** — 每个内部 Tablet 都有一个单调递增的版本号，数据修改时版本号会递增。缓存使用此版本号来检测数据是否过期。外部表不向 Doris 暴露这种版本机制。

3. **OlapScanNode 要求** — 执行计划归一化逻辑只识别 `OlapScanNode` 作为聚合缓存点下方的有效扫描节点，不识别外部表的扫描节点。

对于外部表的缓存需求，请考虑使用 [SQL Cache](./sql-cache-manual.md)。

## 配置参数

### Session 变量（FE）

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `enable_query_cache` | 启用或禁用 Query Cache 的总开关 | `false` |
| `query_cache_force_refresh` | 设为 `true` 时，忽略缓存结果并重新执行查询；新结果仍会写入缓存 | `false` |
| `query_cache_entry_max_bytes` | 单个缓存条目的最大字节数。如果聚合结果超过此限制，该 Fragment 的结果将不会被缓存 | `5242880`（5 MB） |
| `query_cache_entry_max_rows` | 单个缓存条目的最大行数。如果聚合结果超过此限制，该 Fragment 的结果将不会被缓存 | `500000` |

### BE 配置（be.conf）

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `query_cache_size` | 每个 BE 上 Query Cache 的总内存容量，单位为 MB | `512` |

:::note
`be.conf` 中的参数 `query_cache_max_size_mb` 和 `query_cache_elasticity_size_mb` 控制的是旧版 SQL Result Cache，而非本文描述的流水线级别 Query Cache。请勿混淆。
:::

## 使用示例

### 开启 Query Cache

```sql
SET enable_query_cache = true;
```

### 典型场景

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

### 通过 Profile 验证缓存命中

执行查询后，检查查询 Profile。查找 `CacheSourceOperator` 部分：

- `HitCache: true` — 查询从缓存中获取了结果。
- `HitCache: false`，`InsertCache: true` — 查询未命中缓存，但成功将结果写入了缓存。
- `HitCache: false`，`InsertCache: false` — 查询未命中缓存，且结果太大无法缓存。

Profile 中还会显示 `CacheTabletId`，指示涉及的 Tablet。

### 强制刷新

```sql
-- 强制下一次查询跳过缓存并重新计算结果
SET query_cache_force_refresh = true;

SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-15' GROUP BY region;

-- 重置
SET query_cache_force_refresh = false;
```

## 适用场景

Query Cache 在以下场景中最为有效：

- **重复的聚合查询**：仪表板查询、报表查询，或 BI 工具反复发出相同聚合 SQL 的场景。
- **T+1 报表**：数据每天加载一次，当天的后续查询可以命中缓存。
- **分区范围重叠的查询**：查询覆盖重叠日期范围时，可以在分区/Tablet 级别部分共享缓存条目。

Query Cache **不适用于**以下场景：

- **非聚合查询**：普通 SELECT 扫描、JOIN、排序、窗口函数等。
- **外部表**：Hive、JDBC、Iceberg、Hudi、Paimon 等。
- **频繁更新的表**：高频数据写入导致 Tablet 版本快速变化，降低缓存命中率。
- **包含非确定性函数的查询**：`now()`、`rand()`、`uuid()` 和 UDF 会导致缓存被禁用。
- **依赖 Runtime Filter 的查询**：产生 Runtime Filter 的 JOIN 查询会导致扫描 Fragment 上的缓存被禁用。

## 注意事项

- **缓存非持久化**：Query Cache 驻留在 BE 内存中，BE 重启后缓存会被清空。
- **内存消耗**：缓存的数据块会占用 BE 内存。请监控内存使用情况，并根据需要调整 `query_cache_size`。
- **LRU-K 准入机制**：当缓存已满时，新条目必须至少被访问两次才能被准入（LRU-K，K=2），这可以防止低频查询污染缓存。

## 总结

Query Cache 是 Doris 中一种流水线级别的优化机制，按 Tablet 粒度缓存中间聚合结果。其主要特点：

- **仅适用于**内部 OLAP 表上的**聚合查询**
- 基于 Tablet 版本自动进行缓存失效
- 智能地将分区谓词从缓存摘要中分离，使具有重叠分区范围的查询能够共享缓存
- 提供单条目大小和行数限制，防止过大的结果消耗缓存内存
- 使用 LRU-K 淘汰策略维护高质量的缓存
