---
{
    "title": "内存超限错误分析",
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

当查询等任务的报错信息中出现 `MEM_LIMIT_EXCEEDED` 时，说明任务因为进程可用内存不足，或任务超过单次执行的内存上限而被 Cancel。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```

## 进程可用内存不足

若报错信息包含 `Process memory not enough`，说明进程可用内存不足，分析步骤：

1. 解析报错信息。

2. 若任务自身内存过大，尝试减少任务内存使用。

3. 若除任务外的进程已用内存过大，尝试分析内存日志，尝试定位内存位置并考虑减少内存使用，保留更多的内存用于查询等任务执行。

### 解析报错信息

进程可用内存不足分为两种情况，一是进程当前内存超出配置的内存上限，二是系统剩余可用内存低于水位线。存在三个路径会 Cancel 查询等任务：

- 如果报错信息包含`cancel top memory used`，说明任务在内存 Full GC 中被 Cancel。

- 如果报错信息包含`cancel top memory overcommit`，说明任务在内存 Minor GC 中被 Cancel。

- 如果报错信息包含`Allocator sys memory check failed`，说明任务从 `Doris Allocator` 申请内存失败后被 Cancel。

有关内存限制和水位线计算方法、内存 GC 的更多介绍见 [Memory Management Features](./memory-management-feature)

#### 1 在内存 Full GC 中被 Cancel

若 BE 进程内存超过进程内存上限（MemLimit）或系统剩余可用内存低于内存低水位线 (LowWaterMark) 时触发 Full GC，此时会优先 Cancel 内存最大的任务。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

错误信息解析：

1. `(10.16.10.8)`: 查询过程中内存不足的 BE 节点。
2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`：当前被 cancel 的 queryID，Query 本身使用了 866.97 MB 内存。
3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` 进程内存超限的原因，此处是 BE 进程使用的物理内存 3.12 GB 超过了 3.01 GB 的 MemLimit，当前操作系统剩余可供 BE 使用的内存为 191.25 GB 仍高于 LowWaterMark 3.20 GB。

#### 2 在内存 Minor GC 中被 Cancel

若 Doris BE 进程内存超过进程内存软限（SoftMemLimit）或系统剩余可用内存低于内存警告水位线（WarningWaterMark）时触发 Minor GC，此时会优先 Cancel 内存超限比例最大的 Query。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```

错误信息解析：

`process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` 进程内存超限的原因，此处是当前操作系统剩余可供 BE 使用的内存为 3.25 GB 低于 WarningWaterMark 6.40 GB, BE 进程使用的物理内存 2.12 GB 没有超过 2.71 GB 的 SoftMemLimit。

#### 3 从 Allocator 申请内存失败

Doris BE 的大内存申请都会通过 `Doris Allocator` 分配，并在分配时检查内存大小，如果进程可用内存不足则会抛出异常和尝试 Cancel 当前查询或导入。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```

错误信息解析：
1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`：当前被 Cancel 的 queryID，Query 当前使用了 386704704 Bytes 内存，Query 内存峰值为 405956032 Bytes，正在执行的算子为 `VAGGREGATION_NODE (id=7)>`。

2. `Cannot alloc:4294967296`: 当前申请 4 GB 内存时失败，因为当前进程内存 2.23 GB 加上 4 GB 将大于 3.01 GB 的 MemLimit。

### 任务自身内存过大

在上面对报错信息的解析中，若任务自身使用的内存占到进程内存的很大比例，参考 [Memory Analyze Manual](./memory-analyze-manual) 中 [查询内存分析] 分析查询的内存使用，尝试调整参数或优化 SQL 来减少查询执行需要的内存。

需要注意的是，若任务从 Allocator 申请内存失败后被 Cancel，`Cannot alloc` 或 `try alloc` 显示 Query 当前正在申请的内存过大，此时需要关注此处的内存申请是否合理，在 `be/log/be.INFO` 搜索 `Allocator sys memory check failed` 可以找到申请内存的栈。

若任务自身使用的内存很少，继续参考 [分析内存日志，定位进程内存位置并考虑减少内存使用] 尝试减少进程其他位置的内存使用，从而保留更多的内存用于查询等任务执行。

### 分析内存日志，定位进程内存位置并考虑减少内存使用

任务因进程可用内存不足被 Cancel 的同时可以在 `be/log/be.INFO` 中找到如下日志，确认当前进程内存使用是否符合预期，进程内存超限日志的打印默认间隔是 1s，进程内存超限后，BE 大多数位置的内存申请都会感知，并尝试做出预定的回调方法，并打印进程内存超限日志，日志分为两部分 `Process Memory Summary` 和 `Memory Tracker Summary`。

```sql
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
Memory Tracker Summary:
    MemTrackerLimiter Label=other, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=schema_change, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=compaction, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
    MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
    MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=sum of all trackers, Type=overview, Limit=-1.00 B(-1 B), Used=114.80 MB(726799124 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=process resident memory, Type=overview, Limit=-1.00 B(-1 B), Used=3.49 GB(3743289344 B), Peak=3.49 GB(3743289344 B)
    MemTrackerLimiter Label=reserved_memory, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
    MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=DetailsTrackerSet, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTracker Label=IOBufBlockMemory, Parent Label=DetailsTrackerSet, Used=1.41 MB(1474560 B), Peak=1.41 MB(1474560 B)
    MemTracker Label=SegmentCache[size], Parent Label=DetailsTrackerSet, Used=1.64 MB(1720543 B), Peak=18.78 MB(19691997 B)
    MemTracker Label=SchemaCache[number], Parent Label=DetailsTrackerSet, Used=9.21 KB(9428 B), Peak=9.21 KB(9428 B)
    MemTracker Label=TabletSchemaCache[number], Parent Label=DetailsTrackerSet, Used=9.29 MB(9738798 B), Peak=9.29 MB(9738798 B)
    MemTracker Label=TabletMeta(experimental), Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
    MemTracker Label=RuntimeFilterMergeControllerEntity(experimental), Parent Label=DetailsTrackerSet, Used=32.00 B(32 B), Peak=32.00 B(32 B)
    MemTrackerLimiter Label=SegCompaction, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=PointQueryExecutor, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=BlockCompression, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=RowIdStorageReader, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=SubcolumnsTree, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=S3FileBuffer, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=DataPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=198.70 MB(208357157 B), Peak=198.73 MB(208381892 B)
    MemTrackerLimiter Label=IndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=679.73 KB(696047 B), Peak=679.73 KB(696047 B)
    MemTrackerLimiter Label=PKIndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=Query#Id=529e3cb37dff464c-93bd9eafa8944ea6, Type=query, Limit=2.00 GB(2147483648 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
    MemTrackerLimiter Label=MemTableTrackerSet, Type=load, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=SnapshotManager, Type=other, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=0(0 B), Peak=0(0 B)
```

`Process Memory Summary` 是进程内存状态，参考 [Memory Analyze Manual](./memory-analyze-manual) 中 [进程内存状态日志分析]。

`Memory Tracker Summary` 是进程 Memory Tracker 汇总，包含所有 `Type=overview` 和 `Type=global` 的 Memory Tracker，帮助使用者分析当时的内存状态，其中每个 Memory Tracker 的 `Used` 是当前的内存大小，参考 [Memory Tracker](./memory-tracker.md) 中 [查看实时统计结果] 分析每一部分内存的含义。

#### 若 `Label=sum of all trackers` 的值占到 `Label=process resident memory` 的 70% 以上

通常说明 Memory Tracker 统计到了 Doris BE 进程的大部分内存，通常只需要分析 Memory Tracker 定位内存位置，并考虑减少其内存使用，参考 [Memory Tracker](./memory-tracker.md) 中 [Memory Tracker 内存占用过大分析] 分析不同 Memory Tracker 内存占用过大的原因以及减少其内存使用的方法。

此外需要注意 Query Cancel 卡住的问题。Full GC 会先按照内存从大到小 Cancel Query，再按照内存从大到小 Cancel Load。若 Query 在内存 Full GC 中被 Cancel，但此时 BE 进程中存在其他 Query 的内存大于当前被 Cancel 的 Query，需要关注这些更大内存的 Query 是否在 Cancel 过程中卡住。通常执行 `grep 更大内存的queryID be/log/be.INFO` 后查看这些更大内存的 Query 是否触发过 Cancel，并对比 Cancel 的时间和此次 Full GC 的时间，若相隔较长（大于 3s），那么这些在 Cancel 过程中卡住的更大内存的 Query 无法释放内存，也将导致后续的 Query 执行内存不足。

#### 若 `Label=sum of all trackers` 的值占到 `Label=process resident memory` 的 70% 以下

即 `Label=process resident memory` 减去 `Label=sum of all trackers` 的差值较大，说明 Memory Tracker 统计缺失，此时 Memory Tracker 可能无法准确定位内存位置。差值是没有使用 `Doris Allocator` 分配的内存，Doris 主要内存数据结构都继承自 `Doris Allocator`，但仍有一部分内存没有使用 `Doris Allocator` 分配，包括元数据内存、RPC 内存等，也可能是存在内存泄漏，此时除了分析内存值大的 Memory Tracker 外，通常还需要关注元数据内存是否合理，是否存在内存泄漏等。

如果集群方便重启，并且现象可以被复现，建议直接使用 Heap Profile 准确定位内存，这也是最直接和最有效的方法。否则可以先参考 [Memory Analyze Manual](./memory-analyze-manual) 中 [元数据内存分析] 的章节分析 Doris BE 的元数据内存

> 在 Doris 2.1.4 之前的版本 Segment Cache 占用内存大的问题更加常见，通常发现 BE 进程内存不下降时，可以首先参考 [Memory Tracker](./memory-tracker.md) 中对 `Label=SegmentCache` Memory Trakcer 的分析关闭 Segment Cache 后继续测试。

## 任务超过单次执行的内存上限

当报错信息中出现 `exceeded tracker` 时，说明任务超过单次执行内存限制。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

`show variables;` 可以查看 Doris Session Veriable，其中的 `exec_mem_limit` 是单次查询和导入的执行内存限制，但从 Doris 1.2 开始支持查询内存超发 (overcommit)，旨在允许查询设置更灵活的内存限制，内存充足时即使查询内存超过上限也不会被 Cancel，所以通常用户无需关注查询内存使用。直到内存不足时，查询会在尝试分配新内存时等待一段时间，此时会基于一定规则优先 Cancel `mem_used` 与 `exec_mem_limit` 比值大的 Query。如果等待过程中内存释放的大小满足需求，查询将继续执行，否则将抛出异常并终止查询。

如果希望关闭查询内存超发，参考 [BE 配置项](../../admin-manual/config/be-config.md)，在 `conf/be.conf` 中增加 `enable_query_memory_overcommit=false`，此时单次查询和导入的内存超过 `exec_mem_limit` 即会被 Cancel。如果你希望避免大查询对集群稳定性造成的负面影响，或者希望准确控制集群上的任务执行来保证足够的稳定性，那么可以考虑关闭查询内存超发。

如果需要分析查询的内存使用，参考 [3.1 `Label=query, Type=overview` 查询内存使用多]。

### 错误信息分析

错误信息分为三部分：

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`：当前正在执行 Query `f78208b15e064527-a84c5c0b04c04fcf` 在尝试申请 1.03 MB 内存的过程中发现查询超过单次执行的内存上限，查询内存上限是 100 MB（Session Variables 中的 `exec_mem_limit`），当前已经使用 99.25 MB，内存峰值是 99.29 MB。

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`：本次内存申请的位置是`VHASH_JOIN_NODE (id=4)`，并提示可通过 `set exec_mem_limit` 来调高单次查询的内存上限。

### 日志分析

`set enable_profile=true`后，在任务超过单次执行的内存上限时，在 `be/log/be.INFO` 将打印更多日志，用于确认当前查询内存使用是否符合预期。

1. `Process Memory Summary`：进程内存统计，参考 [2.1 Process Memory Summary]。

2. `Memory Tracker Summary`：当前查询的 Memory Tracker 统计，可以看到查询每个算子当前使用的内存和峰值，具体可参考 [Memory Tracker](./memory-tracker.md)。

```sql
Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 32.00 MB, memory tracker limit exceeded, tracker label:Query#I
d=41363cb6ba734ad5-bc8720bdf9b3090d, type:query, limit 100.00 MB, peak used 75.32 MB, current used 72.62 MB. backend 10.16.10.8, process memory used 2.33 GB. exec node:<>, can `set exec_mem_limit=8G`
 to change limit, details see be.INFO.
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 2.33 GB(= 2.60 GB[vm/rss] - 280.53 MB[tc/jemalloc_cache] + 0[reserved] + 0B[waiting_refresh]), limit 338.23 GB, soft limit 304.41 GB. sys availab
le memory 337.33 GB(= 337.33 GB[proc/available] - 0[reserved] - 0B[waiting_refresh]), low water mark 6.40 GB, warning water mark 12.80 GB.
Memory Tracker Summary:    MemTrackerLimiter Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Type=query, Limit=100.00 MB(104857600 B), Used=72.62 MB(76146688 B), Peak=75.32 MB(78981248 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=122.00 B(122 B), Peak=122.00 B(122 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=21.73 MB(22790276 B), Peak=21.73 MB(22790276 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=24.03 MB(25201284 B), Peak=24.03 MB(25201284 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
```
