---
{
    "title": "内存跟踪器",
    "language": "zh-CN",
    "description": "Doris BE 使用内存跟踪器（Memory Tracker）记录进程内存使用，包括查询、导入、Compaction、Schema Change 等任务生命周期中使用的内存，以及各项缓存。支持 Web 页面实时查看，并在内存相关报错时打印到 BE 日志中，用于内存分析和排查内存问题。"
}
---

Doris BE 使用内存跟踪器（Memory Tracker）记录进程内存使用，包括查询、导入、Compaction、Schema Change 等任务生命周期中使用的内存，以及各项缓存。支持 Web 页面实时查看，并在内存相关报错时打印到 BE 日志中，用于内存分析和排查内存问题。

有关 Memory Tracker 的查看方法，以及不同 Memory Tracker 所代表内存占用过大的原因以及减少其内存使用的分析方法在 [Overview](./../overview.md) 中已结合 Doris BE 内存结构一起介绍。本文只介绍 Memory Tracker 原理、结构，以及一些常见问题。

## 内存跟踪原理

Memory Tracker 依赖 Doris Allocator 跟踪内存的每次申请和释放，有关 Doris Allocator 的介绍参考 [内存控制策略](./memory-control-strategy.md)。

进程内存：Doris BE 会定时从系统获取 Doris BE 进程内存，兼容 Cgroup。

任务内存：每个查询、导入、Compaction 等任务初始化时都会创建自己唯一的 Memory Tracker，在执行过程中将 Memory Tracker 放入 TLS（Thread Local Storage）中，Doris 主要的内存数据结构都继承自 Allocator，Allocator 每次申请和释放内存都会记录到 TLS 的 Memory Tracker 中。

算子内存：任务的不同执行算子也会创建自己的 Memory Trakcer，比如 Join/Agg/Sink 等，支持手动跟踪内存或放入 TLS 中由 `Doris Allocator` 记录，用于执行逻辑控制，以及 Query Profile 中分析不同算子的内存使用情况。

全局内存：全局内存主要包括 Cache 和元数据等在不同任务间共享的内存。每个 Cache 有自己唯一的 Memory Tracker，由 `Doris Allocator` 或 手动跟踪；元数据内存目前没有统计完全，更多要依赖 Metrics 和 Bvar 统计的各种元数据 Counter 进行分析。

其中 Doris BE 进程内存因为取自操作系统，可以认为是完全准确的，其他 Memory Tracker 因为实现上的局限性，跟踪的内存通常只是真实内存的一个子集，导致大多数情况下所有 Memory Tracker 之和要小于 Doris BE 进程物理内存，存在一定的缺失，不过 Memory Tracker 记录到的内存在大多数情况下可信度较高，可以放心的用于内存分析。此外 Memory Tracker 实际跟踪的是虚拟内存，而不是通常更关注的物理内存，它们之间也存在一定的误差。

## Memory Tracker 结构

根据使用方式 Memory Tracker 分为两类，第一类 Memory Tracker Limiter，在每个查询、导入、Compaction 等任务和全局 Cache、TabletMeta 唯一，用于观测和控制内存使用；第二类 Memory Tracker，主要用于跟踪查询执行过程中的内存热点，如 Join/Aggregation/Sort/窗口函数中的 HashTable、序列化的中间数据等，来分析查询中不同算子的内存使用情况，以及用于导入数据下刷的内存控制。

二者之间的父子关系只用于快照的打印，使用 Lable 名称关联，相当于一层软链接，不依赖父子关系同时消费，生命周期互不影响，减少理解和使用的成本。所有 Memory Tracker 存放在一组 Map 中，并提供打印所有 Memory Tracker Type 的快照、打印 Query/Load/Compaction  等 Task 的快照、获取当前使用内存最多的一组 Query/Load、获取当前过量使用内存最多的一组 Query/Load 等方法。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker 统计缺失

Doris 2.1 之前和之后的版本中 Memory Tracker 统计缺失的现象不同。

### Memory Tracker 统计缺失现象

1. Doris 2.1 之后 Memory Tracker 统计缺失有两个现象。

- `Label=process resident memory` Memory Tracker 减去 `Label=sum of all trackers` Memory Tracker 的差值过大。

- Orphan Memory Tracker 值过大。

2. Doris 2.1 之前 Orphan Memory Tracker 值过大意味着 Memory Tracker 统计缺失。

### Memory Tracker 统计缺失分析

> 在 Doris 2.1.5 之前的版本中发现 Memory Tracker 统计缺失或 BE 进程内存不下降，优先参考 [Cache 内存分析](./../memory-analysis/doris-cache-memory-analysis.md) 分析 SegmentCache 内存使用，尝试关闭 Segment Cache 后继续测试。

> 在 Doris 2.1.5 之前的版本中 Segment Cache Memory Tacker 不准确，这是因为包括 Primary Key Index 在内的一些 Index 内存统计的是不准确的，导致 Segment Cache 内存没有得到有效限制，经常占用过大的内存，尤其是在成百上千列的大宽表上，参考 [Metadata 内存分析](./../memory-analysis/metadata-memory-analysis.md) 如果你发现 Doris BE Metrics 中 `doris_be_cache_usage{name="SegmentCache"}` 不大，但 Doris BE Bvar 中 `doris_column_reader_num` 很大，则需要怀疑 Segment Cache 的内存占用，如果你在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`ColumnReader` 字段，则基本可以确认是 Segment Cache 占用了大量内存。

如果观察到上述现象，若集群方便重启，并且现象可以被复现，参考 [Heap Profile 内存分析](./../memory-analysis/heap-profile-memory-analysis.md) 使用 Jemalloc Heap Profile 分析进程内存。

否则可以先参考 [Metadata 内存分析](./../memory-analysis/metadata-memory-analysis.md) 分析 Doris BE 的元数据内存。

### Memory Tracker 统计缺失原因

下面介绍 Memory Tracker 统计缺失的原因，涉及到 Memory Tracker 的实现，通常无需关注。

#### Doris 2.1 之后

1. `Label=process resident memory` Memory Tracker 减去 `Label=sum of all trackers` Memory Tracker 的差值过大。

若 `Label=sum of all trackers` Memory Tracker 的值占到 `Label=process resident memory` Memory Tracker 的 70% 以上，通常说明 Memory Tracker 统计到了 Doris BE 进程的大部分内存，通常只需要分析 Memory Tracker 定位内存位置。

若 `Label=sum of all trackers` Memory Tracker 的值占到 `Label=process resident memory` Memory Tracker 的 70% 以下，说明 Memory Tracker 统计缺失，此时 Memory Tracker 可能无法准确定位内存位置。

`Label=process resident memory` Memory Tracker 减去 `Label=sum of all trackers` Memory Tracker 的差值是没有使用 `Doris Allocator` 分配的内存，Doris 主要内存数据结构都继承自 `Doris Allocator`，但仍有一部分内存没有使用 `Doris Allocator` 分配，包括元数据内存、RPC 内存等，也可能是存在内存泄漏，此时除了分析内存值大的 Memory Tracker 外，通常还需要关注元数据内存是否合理，是否存在内存泄漏等。

2. Orphan Memory Tracker 值过大

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker 是默认 Memory Tracker，值为正数或负数都意味着 Doris Allocator 分配的内存跟踪不准，值越大，意味着 Memory Tracker 整体统计结果的可信度越低。其统计值有两个来源：

- 如果线程开始时 TLS 中没有绑定 Memory Tracker，那么 Doris Allocator 会默认将内存记录到 Orphan Memory Tracker 中，意味着这部分内存不知所属，有关 Doris Allocator 记录内存的原理参考上文 [内存跟踪原理]。

- Query 或 Load 等任务 Memory Tracker 析构时如果值不等于 0，，通常意味着这部分内存没有释放，将把这部分剩余的内存记录到 Orphan Memory Tracker 中，相当于将剩余内存交由 Orphan Memory Tracker 继续跟踪。从而保证 Orphan Memory Tracker 和其他 Memory Tracker 之和等于 Doris Allocator 分配出去的所有内存。

理想情况下，期望 Orphan Memory Tracker 的值接近 0。所以我们希望所有线程开始时都 Attach 一个 Orphan 之外的 Memory Tracker，比如 Query 或 Load Memory Tracker。并且所有 Query 或 Load Memory Tracker 析构时都等于 0，这意味着 Query 或 Load 执行过程中使用的内存在析构时都已经被释放。

如果 Orphan Memory Tracker 不等于 0 且值较大，这意味着有大量不知所属的内存没有被释放，或者 Query 和 Load 执行结束后有大量的内存没有被释放，

#### Doris 2.1 之前

Doris 2.1 之前将不知所属的内存都统计到 `Label=Orphan` Memory Tracker 中，所以 Orphan Memory Tracker 值过大意味着 Memory Tracker 统计缺失。
