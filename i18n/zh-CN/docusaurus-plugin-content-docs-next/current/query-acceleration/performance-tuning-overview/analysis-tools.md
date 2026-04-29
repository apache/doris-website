---
{
    "title": "Doris 慢 SQL 性能分析工具：Explain 与 Profile 使用指南",
    "language": "zh-CN",
    "description": "如何分析 Doris 慢 SQL 的性能瓶颈？本文介绍 Explain、Profile 与系统级工具的使用方法，帮助快速定位计划与执行层问题。",
    "keywords": ["Doris 性能分析", "Doris Explain", "Doris Profile", "慢 SQL 分析", "Merged Profile", "Execution Profile", "PipelineTask"]
}
---

<!-- 知识类型：概念 + 工具使用指南 -->
<!-- 适用场景：定位到慢 SQL 后，需进一步分析瓶颈在计划层、执行层还是系统层 -->

## 概述

<!-- 知识类型：概念 -->
<!-- 适用场景：了解慢 SQL 性能分析的整体方法论 -->

性能分析工具用于在已定位到慢 SQL 后，进一步确定性能瓶颈所在环节。上一节[诊断工具](diagnostic-tools.md)帮助业务和运维人员定位到具体的慢 SQL，本章节介绍如何分析这些慢 SQL 的性能瓶颈。

**开篇 Checklist**：开始分析前，请确认你已具备以下条件：

- [ ] 已通过诊断工具定位到具体的慢 SQL
- [ ] 可访问 Doris FE 并具备执行 `EXPLAIN` 的权限
- [ ] 可获取该 SQL 的 Profile（已开启 Profile 收集）
- [ ] 可访问 BE 节点用于查看系统级性能指标（CPU/内存/IO/网络）

### SQL 执行的两阶段与三类瓶颈

一条 SQL 的执行过程分为两个阶段：

1. **计划生成阶段**：负责生成执行计划。
2. **计划执行阶段**：负责执行具体计划。

任一阶段出问题都可能导致性能瓶颈：

- **计划差**：即使执行器再优秀，也无法获得好性能。
- **执行手段不合适**：即使计划正确，也容易产生瓶颈。
- **基础设施缺陷或配置错误**：执行器性能与硬件、系统架构紧密相关。

### 工具与瓶颈类型对应关系

| 瓶颈类型     | 推荐分析工具          | 主要用途                              |
| ------------ | --------------------- | ------------------------------------- |
| 计划层瓶颈   | Doris Explain         | 查看 SQL 执行计划，定位计划生成问题   |
| 执行层瓶颈   | Doris Profile         | 查看运行时各 operator 详细执行信息    |
| 系统级瓶颈   | top/free/perf/sar 等  | 观察系统 CPU/内存/IO/网络运行状态     |

下文分别介绍这三类工具。

## Doris Explain：分析计划层瓶颈

<!-- 知识类型：工具使用 -->
<!-- 适用场景：怀疑计划生成不优导致的慢 SQL，需查看执行计划详情 -->

### 一句话定义

执行计划是对一条 SQL 具体执行方式和过程的描述。例如，对于两表连接的 SQL，执行计划会展示两张表的访问方式、连接方式以及连接顺序等。

### 用途

Doris Explain 工具可方便地展示一个 SQL 执行计划的详细信息。通过分析 Explain 输出，可帮助使用者快速定位计划层瓶颈，针对不同情况进行计划层调优。

### Explain 类型对比

Doris 提供多种粒度的 Explain，用于不同的分析场景：

| Explain 类型         | 输出内容             | 适用场景                       |
| -------------------- | -------------------- | ------------------------------ |
| Explain Verbose      | 最终物理计划         | 查看实际下发到 BE 的物理计划   |
| Explain All Plan     | 各阶段逻辑计划       | 跟踪逻辑计划的演变过程         |
| Explain Memo Plan    | 基于成本优化过程计划 | 分析 CBO 优化器的决策          |
| Explain Shape Plan   | 计划形态             | 快速查看计划骨架与结构         |

各种 Explain 的具体使用方法和输出解释，请参考执行计划 Explain 文档。

### 典型计划层瓶颈

通过分析 Explain 输出，可快速定位以下常见计划层瓶颈：

- **Filter 未下推到基表**：未提前过滤数据，导致参与计算的数据量过多。
- **连接条件未推导到另一侧**：两表 Inner 等值连接中，一侧的过滤条件未推导到另一侧，导致另一侧表数据未提前过滤。

使用 Doris Explain 进行计划层调优的案例，详见[计划调优](../tuning/tuning-plan/optimizing-table-schema.md)章节。

## Doris Profile：分析执行层瓶颈

<!-- 知识类型：工具使用 -->
<!-- 适用场景：计划无明显问题，但 SQL 执行慢，需查看运行时各 operator 耗时 -->

### 一句话定义

Profile 是 SQL 实际执行时各 operator 的详细耗时与运行指标记录，用于定位执行层性能瓶颈。

### 与 Explain 的区别

Explain 描述 SQL 执行的**规划**（如 t1 与 t2 表连接被规划为 Hash Join，t1 在 build 侧、t2 在 probe 侧）；Profile 描述 SQL 执行的**实际过程**（如 build 耗时多少、probe 耗时多少）。

### Profile 文件结构

Profile 文件包含以下主要部分：

1. **查询基本信息**：包括 ID、时间、数据库等。
2. **SQL 语句以及执行计划**。
3. **FE 耗时**：包括 Plan Time、Schedule Time 等。
4. **BE 各 operator 执行耗时**：包括 Merged Profile 和 Execution Profile。

执行侧详细信息主要在最后一部分，下文重点介绍 Profile 提供的执行信息。

### Merged Profile

<!-- 知识类型：工具使用 -->
<!-- 适用场景：快速查看 operator 在所有并发上的聚合性能指标 -->

Merged Profile 提供各 operator 在所有并发上聚合后的核心指标，便于快速定位瓶颈。Doris 中每个 operator 按用户设置的并发数并发执行，Merged Profile 计算每个指标的 Max、Avg、Min 值。

**示例**（以 EXCHANGE_OPERATOR 为例）：

```sql
EXCHANGE_OPERATOR  (id=4):
    -  BlocksProduced:  sum  0,  avg  0,  max  0,  min  0
    -  CloseTime:  avg  34.133us,  max  38.287us,  min  29.979us
    -  ExecTime:  avg  700.357us,  max  706.351us,  min  694.364us
    -  InitTime:  avg  648.104us,  max  648.604us,  min  647.605us
    -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
    -  PeakMemoryUsage:  sum  0.00  ,  avg  0.00  ,  max  0.00  ,  min  0.00  
    -  OpenTime:  avg  4.541us,  max  5.943us,  min  3.139us
    -  ProjectionTime:  avg  0ns,  max  0ns,  min  0ns
    -  RowsProduced:  sum  0,  avg  0,  max  0,  min  0
    -  WaitForDependencyTime:  avg  0ns,  max  0ns,  min  0ns
    -  WaitForData0:  avg  9.434ms,  max  9.476ms,  min  9.391ms
```

**核心指标说明**：

| 指标名称              | 指标含义                                    |
| --------------------- | ------------------------------------------- |
| BlocksProduced        | 产生的 Data Block 数量                      |
| CloseTime             | Operator 在 close 阶段的耗时                |
| ExecTime              | Operator 在各阶段执行的总耗时               |
| InitTime              | Operator 在 Init 阶段的耗时                 |
| MemoryUsage           | Operator 在执行阶段的内存用量               |
| OpenTime              | Operator 在 Open 阶段的耗时                 |
| ProjectionTime        | Operator 在做 projection 的耗时             |
| RowsProduced          | Operator 返回的行数                         |
| WaitForDependencyTime | Operator 等待自身执行条件依赖的时间         |

`WaitForDependencyTime` 因 operator 而异。例如上述 EXCHANGE_OPERATOR 中，条件依赖是上游算子通过 RPC 发送数据，因此该指标实际是在等待上游算子发送数据。

### Execution Profile

<!-- 知识类型：工具使用 -->
<!-- 适用场景：定位某个具体并发实例的细粒度性能问题，或查看 operator 特化指标 -->

Execution Profile 展示某个具体并发实例的详细指标，相比 Merged Profile 更细粒度，并包含 operator 特化指标。

**示例**（以 id=4 的 EXCHANGE_OPERATOR 为例）：

```sql
EXCHANGE_OPERATOR  (id=4):(ExecTime:  706.351us)
      -  BlocksProduced:  0
      -  CloseTime:  38.287us
      -  DataArrivalWaitTime:  0ns
      -  DecompressBytes:  0.00  
      -  DecompressTime:  0ns
      -  DeserializeRowBatchTimer:  0ns
      -  ExecTime:  706.351us
      -  FirstBatchArrivalWaitTime:  0ns
      -  InitTime:  647.605us
      -  LocalBytesReceived:  0.00  
      -  MemoryUsage:  
      -  PeakMemoryUsage:  0.00  
      -  OpenTime:  5.943us
      -  ProjectionTime:  0ns
      -  RemoteBytesReceived:  0.00  
      -  RowsProduced:  0
      -  SendersBlockedTotalTimer(*):  0ns
      -  WaitForDependencyTime:  0ns
      -  WaitForData0:  9.476ms
```

例如 `LocalBytesReceived` 是 EXCHANGE_OPERATOR 特化指标，其他 operator 没有，因此未包含在 Merged Profile 中。

### PipelineTask 执行时间

<!-- 知识类型：工具使用 -->
<!-- 适用场景：分析单个 PipelineTask 的耗时分布，区分实际执行、等待 Worker、等待依赖 -->

在 Doris 中，一个 PipelineTask 由多个 operator 组成。分析 PipelineTask 执行耗时，需重点关注以下三个方面：

| 关注点              | 含义说明                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| ExecuteTime         | PipelineTask 实际执行时间，约等于该 task 中所有 operator 的 ExecTime 之和 |
| WaitWorkerTime      | task 等待执行 Worker 的时间，主要取决于集群负载                           |
| 等待执行依赖的时间  | 所有 operator dependency 等待时间之和（task 可执行需 dependency 全部满足）|

**简化示例**：

```sql
PipelineTask  (index=1):(ExecTime:  4.773ms)
  -  ExecuteTime:  1.656ms
      -  CloseTime:  90.402us
      -  GetBlockTime:  11.235us
      -  OpenTime:  1.448ms
      -  PrepareTime:  1.555ms
      -  SinkTime:  14.228us
  -  WaitWorkerTime:  63.868us
    DATA_STREAM_SINK_OPERATOR  (id=8,dst_id=8):(ExecTime:  1.688ms)
      -  WaitForDependencyTime:  0ns
          -  WaitForBroadcastBuffer:  0ns
          -  WaitForRpcBufferQueue:  0ns
    AGGREGATION_OPERATOR  (id=7  ,  nereids_id=648):(ExecTime:  398.12us)
      -  WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time:  10.495ms
```

该 task 包含两个 operator（DATA_STREAM_SINK_OPERATOR 和 AGGREGATION_OPERATOR）。其中 DATA_STREAM_SINK_OPERATOR 有两个依赖（WaitForBroadcastBuffer 和 WaitForRpcBufferQueue），AGGREGATION_OPERATOR 有一个依赖（AGGREGATION_OPERATOR_DEPENDENCY）。该 task 耗时分布如下：

| 耗时类型            | 数值       | 说明                                                          |
| ------------------- | ---------- | ------------------------------------------------------------- |
| 执行总时间          | 1.656 ms   | 约等于两个 operator 的 ExecTime 之和                          |
| 等待 Worker 时间    | 63.868 us  | 当前集群负载不高，task 就绪后立即有 Worker 来执行             |
| 等待执行依赖时间    | 10.495 ms  | 等于所有 dependency 等待时间之和                              |

使用 Profile 进行执行层调优的案例，详见[执行调优](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)章节。

## 系统级性能工具

<!-- 知识类型：工具使用 -->
<!-- 适用场景：怀疑性能瓶颈在系统层（CPU/内存/IO/网络），辅助定位执行期问题 -->

系统级工具可辅助定位 SQL 执行期的性能瓶颈，观察系统资源运行状态。

| 系统资源 | 常用 Linux 工具       | 主要用途                       |
| -------- | --------------------- | ------------------------------ |
| CPU      | top、perf、sar        | 观察 CPU 使用率与热点函数      |
| 内存     | top、free、sar        | 观察内存使用与交换情况         |
| 磁盘 IO  | iostat、sar           | 观察磁盘读写速率与等待时间     |
| 网络     | sar、netstat          | 观察网络流量与连接状态         |

## FAQ 与 Troubleshooting

<!-- 知识类型：FAQ -->
<!-- 适用场景：使用分析工具时遇到的常见问题 -->

### Q1：Explain、Profile、系统工具，应先用哪一个？

按从高到低的优先级排查：先看 **Explain** 排除计划问题；计划合理后看 **Profile** 定位执行慢的 operator；若 operator 本身耗时合理但整体慢，再看 **系统工具**。

### Q2：Merged Profile 和 Execution Profile 选哪个？

先看 **Merged Profile** 快速识别 operator 间的耗时差异；当怀疑某个并发实例异常或需查看 operator 特化指标时，再看 **Execution Profile**。

### Q3：PipelineTask 整体很慢，但 ExecuteTime 不高，是什么原因？

通常是 **WaitWorkerTime 高**（集群负载高）或 **等待依赖时间高**（上游算子未及时产出数据），需结合 dependency 名称定位上游瓶颈。

### Q4：WaitForDependencyTime 为 0，但 WaitForData0 很高？

`WaitForData0` 是 EXCHANGE_OPERATOR 等待上游 RPC 数据的具体依赖。该指标高通常意味着上游算子产出数据慢，应进一步排查上游 operator。

## 总结

<!-- 知识类型：总结 -->

性能分析工具是快速定位性能瓶颈的重要前提。

- **Doris Explain**：定位计划层瓶颈。
- **Doris Profile**：定位执行层瓶颈（Merged Profile + Execution Profile + PipelineTask 时间）。
- **系统级工具**：辅助定位硬件、操作系统层瓶颈。

熟练组合使用这三类工具，可对 Doris 慢 SQL 性能瓶颈进行端到端定位与解决。
