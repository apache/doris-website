---
{
    "title": "Condition Cache",
    "language": "zh-CN",
    "description": "Apache Doris Condition Cache机制详解：针对重复条件查询的高效缓存优化方案，通过缓存Segment过滤结果减少CPU和IO冗余开销。支持LRU内存管理、bit向量压缩存储，提供命中率监控指标，显著提升高并发OLAP查询性能，适用于数据相对稳定、高选择性的重复过滤场景。"
}
---

## 简介

在大规模分析型场景中，查询往往包含重复的过滤条件（Condition），例如

```
SELECT * FROM orders WHERE region = 'ASIA';` `SELECT count(*) FROM orders WHERE region = 'ASIA';
```

这类查询在相同数据分片（Segment）上会反复执行相同的过滤逻辑，造成 **CPU 与** **IO** **的冗余开销**。

为了解决这一问题，Apache Doris 引入了 **Condition Cache** 机制。它能够缓存特定条件在某个 Segment 上的过滤结果，并在后续查询中直接复用，从而 **减少不必要的扫描与过滤**，显著降低查询延迟。

## 工作原理

Condition Cache 的核心思想是：

- **相同的过滤条件在相同的数据分片上，结果是一致的**。
- Doris 将「条件表达式 + Key Range」生成一个 **64 位摘要（digest）**，作为缓存的唯一标识符。
- 每个 Segment 都可以根据这个摘要在缓存中查找已有的过滤结果。

缓存结果以压缩的 **bit 向量（std::vector<bool>）** 存储：

- **0** 表示该行范围不满足条件，可直接跳过；
- **1** 表示该范围可能包含满足条件的数据，需要继续扫描。

通过这种方式，Doris 可以在粗粒度上快速剔除无效数据块，仅在必要时进行精确过滤。

## 使用条件

Condition Cache 在以下场景下最为有效：

**重复条件**：相同或相似的过滤条件被频繁使用。

**数据相对稳定**：Segment 内部数据通常不可变（INSERT/Compaction 后会生成新的 Segment，自然淘汰旧缓存）。

**高选择性**：条件过滤后仅保留少量行，能够最大化减少扫描。

以下场景下不会使用 Condition Cache：

- 查询中包含 **Delete 条件**（删除标记需要保证正确性，因此禁用缓存）。
- 运行时生成的 **TopN Runtime Filter**（暂不支持）。

## 配置与管理

### 开启与关闭

```Plain
set enable_condition_cache = true;
```

### 内存管理

- Condition Cache 使用 **LRU 策略** 进行缓存淘汰。
- 超过 `condition_cache_limit` 后，最近最少使用的条目会被自动清除。

 如需修改通过 `be.conf` 中修改参数： `condition_cache_limit = 1024 `,单位为mb

- Segment Compaction 之后，旧缓存也会随着LRU的淘汰自然失效。

## 缓存统计

Doris 提供了丰富的统计指标，方便用户观察 Condition Cache 的效果：

- **Profile 级别指标**（查询执行计划中可见）
  - `ConditionCacheSegmentHit`：命中缓存的 Segment 数量
  - `ConditionCacheFilteredRows`：被缓存直接过滤掉的行数
- **系统指标**（通过监控系统或 `metrics` 查看）
  - `condition_cache_search_count`：缓存查找次数
  - `condition_cache_hit_count`：缓存命中次数

用户可通过这些指标来评估 Condition Cache 的收益和命中率。

## 使用示例

### 典型场景

假设我们有如下查询：

```
SELECT order_id, amount ` `FROM orders ` `WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

- **第一次执行**：需要完整扫描并评估条件，Condition Cache 将结果存储到 LRU 缓存中。
- **后续相同查询**：直接利用缓存，跳过大部分无效行范围，仅扫描可能满足条件的部分。

当多个查询共享相同过滤条件时（例如 `region = 'ASIA' AND order_date >= '2023-01-01'`），它们也可以互相复用 Condition Cache，从而减少整体开销。

## 注意事项

- **缓存不会持久化**：Doris 重启后，Condition Cache 会被清空。
- **删除操作会禁用缓存**：涉及删除标记的 Segment 必须保证强一致性，因此不会使用 Condition Cache。

## 总结

Condition Cache 是 Doris 针对 **重复条件查询** 的优化机制, 它的优势在于：

- 避免冗余计算，降低 CPU/IO 消耗
- 自动化透明生效，无需用户干预
- 内存占用小，命中率与过滤率高时效果显著

通过合理利用 Condition Cache，用户可以在高频 OLAP 查询场景中获得更快的响应速度。
