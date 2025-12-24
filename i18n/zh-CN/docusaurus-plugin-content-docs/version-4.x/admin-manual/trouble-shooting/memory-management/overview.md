---
{
    "title": "概述",
    "language": "zh-CN",
    "description": "内存管理是 Doris 中最重要的组成部分之一，在 Doris 运行过程中，不论导入还是查询都依赖大量的内存操作。内存管理的好坏直接影响到 Doris 的稳定性和性能。"
}
---

内存管理是 Doris 中最重要的组成部分之一，在 Doris 运行过程中，不论导入还是查询都依赖大量的内存操作。内存管理的好坏直接影响到 Doris 的稳定性和性能。

Apache Doris 作为基于 MPP 架构的 OLAP 数据库，数据从磁盘加载到内存后，会在算子间流式传递并计算，在内存中存储计算的中间结果，这种方式减少了频繁的磁盘 I/O 操作，充分利用多机多核的并行计算能力，可在性能上呈现巨大优势。

在面临内存资源消耗巨大的复杂计算和大规模作业时，有效的内存分配、统计、管控对于系统的稳定性起着十分关键的作用——更快的内存分配速度将有效提升查询性能，通过对内存的分配、跟踪与限制可以保证不存在内存热点，及时准确地响应内存不足并尽可能规避 OOM 和查询失败，这一系列机制都将显著提高系统稳定性；同时更精确的内存统计，也是大查询落盘的基础。

## Doris BE 内存结构

![Memory Structure](/images/memory-structure.png)

```
Server physical memory: 供服务器上所有进程使用的的物理内存，`cat /proc/meminfo` 或 `free -h` 看到的 MemTotal。
    |
    |---> Linux Kernel Memory And Other Process Memory: Linux 内核和其他进程使用的内存。
    |
    |---> Doris BE Process Memory: Doris BE 进程使用的内存，上限是服务器物理内存减去 Linux 内核和其他进程使用的内存，或者 Cgroup 配置的内存大小。
            |
            |---> untracked: 没有被跟踪和管理的内存，包括 rpc，jvm，部分 metadata 等。在访问外表或使用 java udf 时会用到 jvm。
            |
            |---> tracked: 被跟踪和管理的内存，允许实时查看，自动内存回收，通过参数控制大小。
                    |
                    |---> jemalloc: jemalloc 管理的 cache 和 metadata，支持参数控制，内存不足时自动回收。
                    |
                    |---> global: Doris 全局共享的内存，主要包括 cache 和 metadata。
                    |       |
                    |       |---> doris cache: doris 自己管理的 cache，支持单独通过参数控制容量和淘汰时长，内存不足时自动回收。
                    |       |
                    |       |---> doris metadata: BE 上存储数据的 metadata，包括数据 schema 等一系列内存数据结构和它们的缓存。
                    |
                    |---> task: Doris 上执行的任务使用的内存，预期在任务结束后释放，包括 query，load，compaction 等。
                    |       |
                    |       |---> query: 查询期间使用的内存。一个查询被拆分成多个 fragment 单独执行，通过数据 shuffle 相连。
                    |       |       |
                    |       |       |---> fragment: 一个 fragment 被拆分成多个 operator 以 pipeline 的形式执行。
                    |       |       |       |
                    |       |       |       |---> operator: 包括 data block, hash table, arena, exchange sink buffer 等内存数据结构。
                    |       |
                    |       |---> load: 数据导入期间使用的内存。数据导入包括 fragment 读取和 channel 写入数据两个阶段。
                    |       |       |
                    |       |       |---> fragment: 和查询的 fragment 执行相同，stream load 通常只有 scan operator。
                    |       |       |
                    |       |       |---> channel: tablet channel 将数据写入临时的数据结构 memtable，然后 delta writer 将数据压缩后写入文件。
```

---

## 内存查看

Doris BE 使用内存跟踪器（Memory Tracker）记录进程内存使用，支持 Web 页面查看，并在内存相关报错时打印到 BE 日志中，用于内存分析和排查内存问题。

### 实时内存统计

实时的内存统计结果通过 Doris BE 的 Web 页面查看 `http://{be_host}:{be_web_server_port}/mem_tracker`，展示 `type=overview` 的 Memory Tracker 当前跟踪的内存大小和峰值内存大小，包括 Query/Load/Compaction/Global 等，`be_web_server_port` 默认 8040。

![image](/images/memory-used-by-subsystem.png)

Memory Tracker 分为不同的类型，其中 `type=overview` 的 Memory Tracker 中除 `process resident memory`、`process virtual memory`、`sum of all trackers` 外，其他 `type=overview` 的 Memory Tracker 都可以通过 `http://{be_host}:{be_web_server_port}/mem_tracker?type=Lable` 查看详情。

Memory Tracker 拥有如下的属性：

1. Label: Memory Tracker 的名称
2. Current Consumption(Bytes): 当前内存值，单位 B。
3. Current Consumption(Normalize): 当前内存值的 .G.M.K 格式化输出。
4. Peak Consumption(Bytes): BE 进程启动后的内存峰值，单位 B，BE 重启后重置。
5. Peak Consumption(Normalize): BE 进程启动后内存峰值的 .G.M.K 格式化输出，BE 重启后重置。
6. Parent Label: 用于表明两个 Memory Tracker 的父子关系，Child Tracker 记录的内存是 Parent Tracker 的子集，Parent 相同的不同 Tracker 记录的内存可能存在交集。

有关 Memory Tracker 的更多介绍参考 [内存跟踪器](./memory-feature/memory-tracker.md)。

### 历史内存统计

历史的内存统计结果通过 Doris BE 的 Bvar 页面查看 `http://{be_host}:{brpc_port}/vars/*memory_*`，用实时内存统计页面 `http://{be_host}:{be_web_server_port}/mem_tracker` 中 Memory Tracker 的 Label 搜索 Bvar 页面，即可得到对应 Memory Tracker 跟踪的内存大小变化趋势，`brpc_port` 默认 8060。

![Bvar Memory](/images/bvar-memory.png)

当报错进程内存超限或可用内存不足时，在 `be/log/be.INFO` 日志中可以找到 `Memory Tracker Summary`，包含所有 `Type=overview` 和 `Type=global` 的 Memory Tracker，帮助使用者分析当时的内存状态，具体参考 [内存日志分析](./memory-analysis/memory-log-analysis.md)

---

## 内存分析

将 `type=overview` 的 Memory Tracker 对应到上述内存结构中 `tracked` 下的每一部分内存：

```
Doris BE Process Memory
    |
    |---> tracked: 对应 `MemTrackerLimiter Label=sum of all trackers, Type=overview`，是 Memory Tracker 统计到的所有内存，即除 `Label=process resident memory` 和 `Label=process virtual memory` 外，其他 `type=overview` 的 Memory Tracker 的 Current Consumption 总和。
            |
            |---> jemalloc
            |       |
            |       |---> jemalloc cache: 对应 `MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview`，Jemalloc 缓存包括 Dirty Page、Thread Cache 两部分。
            |       |
            |       |---> jemalloc metadata: 对应 `MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview`，Jemalloc 的 Metadata。
            |
            |---> global: 对应 `MemTrackerLimiter Label=global, Type=overview`，包括 Cache、元数据、解压缩 等生命周期和进程相同的全局 Memory Tracker，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` 展示 `type=global` 的所有 Memory Tracker。
            |
            |---> task
            |       |
            |       |---> query: 对应 `MemTrackerLimiter Label=query, Type=overview`，即所有 Query Memory Tracker 的 Current Consumption 总和，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` 展示 `type=query` 的所有 Memory Tracker。
            |       |
            |       |---> load: 对应 `MemTrackerLimiter Label=load, Type=overview`，所有 Load Memory Tracker 的 Current Consumption 总和，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=load` 展示 `type=load` 的所有 Memory Tracker。
            |       |
            |       |---> reserved: 对应 `MemTrackerLimiter Label=reserved_memory, Type=overview`，被预留的内存，查询在构建 Hash Table 等需要大内存的行为之前，会先从 Memory Tracker 中预留出所构建 Hash Table 大小的内存，确保后续内存申请能够满足。
            |       |
            |       |---> compaction: 对应 `MemTrackerLimiter Label=compaction, Type=overview`，所有 Compaction Memory Tracker 的 Current Consumption 总和，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=compaction` 展示 `type=compaction` 的所有 Memory Tracker。
            |       |
            |       |---> schema_change: 对应 `MemTrackerLimiter Label=schema_change, Type=overview`，所有 Schema Change Memory Tracker 的 Current Consumption 总和，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=schema_change` 展示 `type=schema_change` 的所有 Memory Tracker。

            |       |
            |       |---> other: 对应 `MemTrackerLimiter Label=other, Type=overview`，除上述之外其他任务的内存总和，例如 EngineAlterTabletTask、EngineCloneTask、CloudEngineCalcDeleteBitmapTask、SnapshotManager 等，Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=other` 展示 `type=other` 的所有 Memory Tracker。
    |
    |---> Doris BE 进程物理内存，对应 `MemTrackerLimiter Label=process resident memory, Type=overview`，Current Consumption 取自 VmRSS in `/proc/self/status`，Peak Consumption 取自 VmHWM in `/proc/self/status`。
    |
    |---> Doris BE 进程虚拟内存，对应 `MemTrackerLimiter Label=process virtual memory, Type=overview`，Current Consumption 取自 VmSize in `/proc/self/status`，Peak Consumption 取自 VmPeak in `/proc/self/status`。
```

上述内存结构中每一部分内存的分析方法：

1. [Jemalloc 内存分析](./memory-analysis/jemalloc-memory-analysis.md)

2. [全局内存分析](./memory-analysis/global-memory-analysis.md)

3. [Query 内存分析](./memory-analysis/query-memory-analysis.md)

4. [Load 内存分析](./memory-analysis/load-memory-analysis.md)

---

## 内存问题 FAQ

参考 [内存问题 FAQ](./memory-issue-faq.md) 分析常见的内存问题。

---

## 内存控制策略

参考 [内存控制策略](./memory-feature/memory-control-strategy.md) 中对内存分配、监控、回收的介绍，它们保证了 Doris BE 进程内存的高效可控。
