---
{
    "title": "Doris 并行度调优：parallel_pipeline_task_num 参数设置指南",
    "language": "zh-CN",
    "description": "如何调优 Doris 查询并行度？本文详解 parallel_pipeline_task_num 配置原则、SQL/会话/全局三级调整方法、CPU 利用率优化案例与常见问题。",
    "keywords": ["Doris 并行度调优", "parallel_pipeline_task_num", "Doris CPU 利用率", "MPP 并行执行", "Pipeline 执行引擎", "查询性能调优"],
    "sidebar_label": "并行度调优"
}
---

# Doris 并行度调优

<!-- 知识类型：概念 + 操作 -->
<!-- 适用场景：查询性能调优、CPU 资源利用优化、高并发压测 -->

## 概述

Doris 是 MPP 执行框架，每条查询都会在多个 BE 上并行执行；单个 BE 内部也通过多线程并行加速执行。所有语句（Query、DML、DDL）均支持并行执行。

**一句话定义**：`parallel_pipeline_task_num` 控制单个 BE 内单个 Fragment 执行时使用的工作任务数。

### 适用读者快速 Checklist

在开始调优之前，请先确认：

-   [ ] 是否通过 `PROFILE` 工具确认查询为 CPU 瓶颈？
-   [ ] 当前 BE 的 CPU 核数是多少？
-   [ ] 查询类型属于点查、JOIN/聚合、压测还是复杂查询？
-   [ ] 是否使用 Duplicate 或 Unique Key Merge-On-Write 表模型？
-   [ ] 计划在 SQL、会话还是全局级别调整？

> 默认值为 `0`，等同于 BE 的 CPU 核数的一半。该默认值已平衡了单查询和并发资源利用，**通常不需要用户介入调整**。

---

## 并行度调优原则

<!-- 知识类型：原则 -->
<!-- 适用场景：场景化决策参考 -->

`parallel_pipeline_task_num` 的目的是充分利用多核资源、降低查询延迟。但多核并行会引入数据 Shuffle 算子和多线程同步逻辑，过高的并行度反而会带来资源浪费。

### 场景与推荐并行度对照表

> 下表以 BE CPU 核数 = 16 为例。

| 查询场景 | 典型特征 | 推荐并行度 | 调整理由 |
| --- | --- | --- | --- |
| 单表简单操作 | 单表点查、`WHERE` 扫描少量数据、`LIMIT` 少量数据、命中物化视图 | **1** | 仅有一个 Fragment，瓶颈在数据扫描线程（自适应并行），而非查询执行线程 |
| 两表 JOIN / 聚合 | 数据量大、CPU 密集型，CPU 未打满 | **16** | 充分利用 Pipeline 执行引擎并行能力；不应无限制增加（如 48 反而增加调度开销） |
| 高并发压测 | 多个查询本身已能填满 CPU | **1** | 过大并行度反而带来线程调度和框架调度开销 |
| 复杂查询 | 难以一次确定瓶颈 | **默认值** | 建议通过 Profile 和机器负载灵活调整，按 4-2-1 阶梯方式尝试 |

> Doris 持续完善自适应策略，通常建议在**特定场景或 SQL 级别**进行必要的调整。

---

## 查询并行度调优方法

<!-- 知识类型：操作 -->
<!-- 适用场景：实际配置生效 -->

Doris 支持手动指定查询并行度，提供 SQL、会话、全局三个粒度。

### 方法 1：SQL 级别（推荐）

-   **目的**：仅影响单条 SQL，灵活精准控制。
-   **命令**：使用 SQL HINT。
-   **说明**：适用于针对特定 SQL 的精细调优，不影响其他查询。

```sql
SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;

SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;
```

### 方法 2：会话级别

-   **目的**：影响当前会话所有查询。
-   **命令**：通过 session variables 设置。
-   **说明**：会话内所有 SQL 都使用该并行度，包括单行查询，可能导致部分小查询性能下降。

```sql
SET parallel_pipeline_task_num = 8;
```

### 方法 3：全局级别

-   **目的**：影响整个集群默认行为。
-   **命令**：使用 `SET GLOBAL`。
-   **说明**：通常用于全局 CPU 利用率调优。`global` 设置后，对当前连接和新建连接生效，已有的其他连接不生效；如需立即全部生效，可重启 FE。

```sql
SET GLOBAL parallel_pipeline_task_num = 8;
```

### 三种调整方式对比

| 调整方式 | 影响范围 | 生效时机 | 推荐场景 |
| --- | --- | --- | --- |
| SQL HINT | 单条 SQL | 立即 | 单 SQL 精细调优（**最安全**） |
| Session | 当前会话 | 立即 | 一组相关查询调优 |
| Global | 整个集群 | 新建连接生效 | 集群级 CPU 利用率优化 |

---

## 数据分片与并行度

<!-- 知识类型：版本特性 -->
<!-- 适用场景：理解版本差异、表模型选择 -->

从 **2.1 版本**开始，Doris 支持并行度与数据分片数量解耦。

### 版本对比

| 版本 | 行为 | 限制 |
| --- | --- | --- |
| 2.1 之前 | 并行度 ≤ 查询涉及分片数 | 5 个分片最多 5 路并发，大分片无法并发读取 |
| 2.1 及之后 | 支持分片内并发读取（自动开启） | 仅支持 Duplicate 和 Unique Key Merge-On-Write 表模型 |

> **注意**：Aggregate 模型和 Unique Key Merge-On-Read 模型不适用，查询并行度仍受限于分片数量。

---

## 最佳实践案例

<!-- 知识类型：案例 -->
<!-- 适用场景：实际生产调优参考 -->

### 案例 1：CPU 使用率过高 — 调低并行度

**问题现象**：线上 CPU 使用率过高，影响低时延查询性能。

**原因分析**：Doris 默认优先使用更多资源以最快速度获取查询结果。在线上资源紧张场景下，可能影响整体稳定性。

**解决方案**：将并行度从默认 `0`（CPU 核数的一半）调低为 `4`。

```sql
SET GLOBAL parallel_pipeline_task_num = 4;
```

**效果**：CPU 使用率降低到原先高峰值的 **60%**，减少了对低时延查询的影响。

> `GLOBAL` 设置对当前连接和新建连接生效；已有连接不受影响。如需立即全部生效，可重启 FE。

### 案例 2：CPU 利用率不足 — 调高并行度

**问题现象**：计算密集型查询执行 28 秒，CPU 利用率仅 60%。

**SQL 示例**（左表 20 亿，右表 500 万）：

```sql
SELECT
    sum(if(t2.value IS NULL, 0, 1)) AS exist_value,
    sum(if(t2.value IS NULL, 1, 0)) AS no_exist_value
FROM t1
LEFT JOIN t2 ON t1.key = t2.key;
```

**Profile 关键指标**：

```text
HASH_JOIN_OPERATOR (id=3 , nereids_id=448):
  - PlanInfo
      - join op: LEFT OUTER JOIN(BROADCAST)[]
      - equal join conjunct: (value = value)
      - cardinality=2,462,330,332
      - vec output tuple id: 5
      - output tuple id: 5
      - vIntermediate tuple ids: 4
      - hash output slot ids: 16
      - projections: value
      - project output tuple id: 5
  - BlocksProduced: sum 360.099K (360099), avg 45.012K (45012), max 45.014K (45014), min 45.011K (45011)
  - CloseTime: avg 8.44us, max 13.327us, min 5.574us
  - ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms
  - InitTime: avg 7.122us, max 13.395us, min 4.541us
  - MemoryUsage: sum , avg , max , min
    - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
    - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
  - OpenTime: avg 2.967us, max 4.120us, min 1.562us
  - ProbeRows: sum 1.4662330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
  - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
  - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

**原因分析**：

-   主要耗时（`ExecTime: avg 26sec153ms`）集中在 Join 算子。
-   处理数据总量（`ProbeRows: 14.66 亿`）巨大，属于典型 CPU 密集型运算。
-   监控显示 CPU 利用率仅 60%，存在加速空间。

**解决方案**：调高并行度。

```sql
SET parallel_pipeline_task_num = 16;
```

**效果对比**：

| 指标 | 调整前 | 调整后 |
| --- | --- | --- |
| 查询耗时 | 28 秒 | **19 秒** |
| CPU 利用率 | 60% | **90%** |

---

## FAQ 常见问题

<!-- 知识类型：FAQ -->
<!-- 适用场景：快速排错 -->

**Q1：默认并行度是多少？**
默认值为 `0`，运行时等同于 BE CPU 核数的一半。

**Q2：并行度设置越大越好吗？**
不是。过大的并行度会带来线程调度和框架调度开销，反而降低性能。例如 16 核 BE 设置为 48 不会带来收益。

**Q3：`SET GLOBAL` 后为什么旧连接没生效？**
`GLOBAL` 仅对当前连接和新建连接生效，已有其他连接不受影响。如需立即全部生效，可重启 FE。

**Q4：所有表模型都支持分片内并发读取吗？**
仅 Duplicate 和 Unique Key Merge-On-Write 模型支持。Aggregate 模型和 Unique Key Merge-On-Read 模型查询并行度仍受限于分片数量。

**Q5：如何判断查询是否为 CPU 瓶颈？**
使用 `PROFILE` 观察 `ExecTime` 集中在哪个算子；同时观察机器 CPU 利用率。若 CPU 未打满，可考虑调高并行度。

---

## Troubleshooting 故障排查

<!-- 知识类型：故障排查 -->
<!-- 适用场景：调优后遇到性能异常 -->

| 现象 | 可能原因 | 排查建议 |
| --- | --- | --- |
| 调高并行度后查询反而变慢 | 线程调度开销超过并行收益 | 通过 Profile 检查算子耗时；按 4-2-1 阶梯回退 |
| CPU 利用率打满但查询变慢 | 并行度过高导致上下文切换 | 调低并行度，关注高并发场景设为 1 |
| 全局调整未生效 | 已有连接未应用新配置 | 重启 FE 或重连客户端 |
| 大分片读取速度慢 | 版本低于 2.1，受分片数限制 | 升级到 2.1+，确认表模型为 Duplicate 或 MoW |

---

## 总结

<!-- 知识类型：总结 -->

通常用户不需要介入调整查询并行度。如需调整，请遵循以下原则：

1.  **从 CPU 利用率出发**：通过 `PROFILE` 工具确认是否为 CPU 瓶颈，再决定是否调整。
2.  **优先 SQL 级别调整**：单 SQL HINT 调整最安全，避免在全局做激进修改。
3.  **场景化决策**：参考[场景与推荐并行度对照表](#场景与推荐并行度对照表)选择合适值。
4.  **阶梯式尝试**：复杂查询建议按 4-2-1 阶梯方式逐步调整，观察查询表现和机器负载。
