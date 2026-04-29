---
title: Condition Cache 条件缓存加速重复过滤查询
description: Doris Condition Cache 如何通过缓存 Segment 过滤结果加速重复条件查询？本文详解原理、配置与命中率监控。
keywords:
    - Doris Condition Cache
    - 条件缓存
    - 查询加速
    - 重复过滤优化
    - Segment 过滤缓存
    - LRU 缓存
    - OLAP 高并发查询
    - enable_condition_cache
---

<!-- 知识类型: 能力定义 / 配置参数 / 性能调优 -->
<!-- 适用场景: 高频重复条件查询 / 查询性能优化 -->

## 简介

**Condition Cache** 是 Apache Doris 针对重复条件查询的查询加速机制：它将特定过滤条件在某个 Segment 上的结果缓存为压缩 bit 向量，后续查询命中后可直接复用，避免重复扫描与过滤，从而降低 CPU 与 IO 开销并缩短查询延迟。

在大规模分析型场景中，查询往往包含重复的过滤条件（Condition），例如：

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

这类查询会在相同的数据分片（Segment）上反复执行相同的过滤逻辑，造成 **CPU 与 IO 的冗余开销**。Condition Cache 通过复用过滤结果，**减少不必要的扫描与过滤**，显著降低查询延迟。

### 快速导航

- [我的查询能否使用 Condition Cache？](#适用场景)
- [如何开启与配置？](#配置与管理)
- [如何观察缓存效果？](#缓存统计与监控)
- [常见问题](#常见问题-faq)

## 工作原理

<!-- 知识类型: 架构原理 -->

Condition Cache 的核心思想是：**相同的过滤条件在相同的数据分片上，结果是一致的**。

1. Doris 将「条件表达式 + Key Range」生成一个 **64 位摘要（digest）**，作为缓存的唯一标识符。
2. 每个 Segment 都可以根据这个摘要在缓存中查找已有的过滤结果。
3. 缓存结果以压缩的 **bit 向量（`std::vector<bool>`）** 存储。

bit 向量的语义如下：

| 位值 | 含义                                       |
| ---- | ------------------------------------------ |
| `0`  | 该行范围不满足条件，可直接跳过             |
| `1`  | 该范围可能包含满足条件的数据，需要继续扫描 |

通过这种方式，Doris 可以在粗粒度上快速剔除无效数据块，仅在必要时进行精确过滤。

## 适用场景

<!-- 知识类型: 架构选型决策 -->

### 推荐使用的场景

Condition Cache 在以下场景下最为有效：

| 场景             | 说明                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| **重复条件**     | 相同或相似的过滤条件被频繁使用                                                  |
| **数据相对稳定** | Segment 内部数据通常不可变（INSERT/Compaction 后会生成新的 Segment，自然淘汰旧缓存） |
| **高选择性**     | 条件过滤后仅保留少量行，能够最大化减少扫描                                      |

### 不会使用 Condition Cache 的场景

以下场景下 Condition Cache 不会生效：

- 查询中包含 **Delete 条件**（删除标记需要保证正确性，因此禁用缓存）。
- 运行时生成的 **TopN Runtime Filter**（暂不支持）。

## 配置与管理

<!-- 知识类型: 配置参数 -->

### 开启与关闭

- **目的**：在会话级别启用 Condition Cache。
- **命令**：

    ```sql
    set enable_condition_cache = true;
    ```

- **说明**：该参数控制当前会话是否使用 Condition Cache。

### 内存管理

Condition Cache 的内存使用基于以下规则：

| 项目       | 说明                                                          |
| ---------- | ------------------------------------------------------------- |
| 淘汰策略   | **LRU（最近最少使用）**，超过容量上限后自动清除最久未使用的条目 |
| 容量参数   | `condition_cache_limit`，单位为 MB，默认 `1024`                 |
| 配置位置   | `be.conf`                                                     |
| 自然失效   | Segment 经过 Compaction 后，旧缓存随 LRU 淘汰自然失效              |

修改容量上限的示例：

```properties
# be.conf
condition_cache_limit = 1024
```

## 缓存统计与监控

<!-- 知识类型: 操作步骤 -->

Doris 提供了丰富的统计指标，便于观察 Condition Cache 的效果。用户可通过这些指标评估缓存的收益和命中率。

### Profile 级别指标

在查询执行计划（Profile）中可见：

| 指标名称                       | 含义                          |
| ------------------------------ | ----------------------------- |
| `ConditionCacheSegmentHit`     | 命中缓存的 Segment 数量        |
| `ConditionCacheFilteredRows`   | 被缓存直接过滤掉的行数        |

### 系统指标

通过监控系统或 `metrics` 接口查看：

| 指标名称                        | 含义           |
| ------------------------------- | -------------- |
| `condition_cache_search_count`  | 缓存查找次数   |
| `condition_cache_hit_count`     | 缓存命中次数   |

## 使用示例

### 典型场景

假设我们有如下查询：

```sql
SELECT order_id, amount
FROM orders
WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

执行流程：

1. **第一次执行**：需要完整扫描并评估条件，Condition Cache 将结果存储到 LRU 缓存中。
2. **后续相同查询**：直接利用缓存，跳过大部分无效行范围，仅扫描可能满足条件的部分。

当多个查询共享相同的过滤条件时（例如 `region = 'ASIA' AND order_date >= '2023-01-01'`），它们也可以互相复用 Condition Cache，从而减少整体开销。

## 注意事项

- **缓存不会持久化**：Doris 重启后，Condition Cache 会被清空。
- **删除操作会禁用缓存**：涉及删除标记的 Segment 必须保证强一致性，因此不会使用 Condition Cache。

## 常见问题 FAQ

**Q1：Condition Cache 与 Query Cache 有什么区别？**

Condition Cache 缓存的是「过滤条件在 Segment 上的命中情况」（bit 向量），粒度更细，可在不同查询间复用；它属于查询执行层的优化机制。

**Q2：开启 Condition Cache 后查询并没有变快，可能是什么原因？**

可参考以下排查方向：

- 查询条件包含 Delete 标记或 TopN Runtime Filter，缓存未生效。
- 数据写入频繁，Compaction 后旧 Segment 被新 Segment 替换，缓存被淘汰。
- 条件选择性较低，过滤后仍保留大量行，收益不明显。
- 通过 `condition_cache_hit_count` / `condition_cache_search_count` 检查命中率是否偏低。

**Q3：如何确认某次查询是否命中了 Condition Cache？**

查看 Profile 中的 `ConditionCacheSegmentHit` 与 `ConditionCacheFilteredRows` 指标，若值大于 0 则表示命中并产生了过滤收益。

**Q4：调整 `condition_cache_limit` 后需要重启吗？**

`condition_cache_limit` 在 `be.conf` 中配置，修改后需要重启 BE 才能生效。

## 总结

Condition Cache 是 Doris 针对**重复条件查询**的优化机制，其优势在于：

- 避免冗余计算，降低 CPU/IO 消耗；
- 自动化透明生效，无需用户干预；
- 内存占用小，命中率与过滤率高时效果显著。

通过合理利用 Condition Cache，用户可以在高频 OLAP 查询场景中获得更快的响应速度。
