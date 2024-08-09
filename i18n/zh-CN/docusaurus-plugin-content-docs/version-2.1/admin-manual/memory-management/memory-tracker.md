---
{
    "title": "内存跟踪器",
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

内存跟踪器（Memory Tracker）记录了 Doris BE 进程内存使用，包括查询、导入、Compaction、Schema Change 等任务生命周期中使用的内存，以及各项缓存，用于实时分析进程和查询的内存热点位置。

## 原理

进程内存: Doris BE 会定时从系统获取 Doris BE 进程内存，兼容Cgroup。

任务内存: 每个查询、导入、Compaction等任务初始化时都会创建自己唯一的 Memory Tracker，在执行过程中将 Memory Tracker 放入 TLS（Thread Local Storage）中，Doris 主要的内存数据结构都继承自 Allocator，Allocator 每次申请和释放内存都会记录到 TLS 的 Memory Tracker 中。

算子内存：任务的不同执行算子也会创建自己的 Memory Trakcer，比如 Join/Agg/Sink 等，支持手动跟踪内存或放入 TLS 中由 `Doris Allocator` 记录，用于执行逻辑控制，以及 Query Profile 中分析不同算子的内存使用情况。

全局内存: 全局内存主要包括 Cache 和元数据等在不同任务间共享的内存。每个 Cache 有自己唯一的 Memory Tracker，由 `Doris Allocator` 或 手动跟踪；元数据内存目前没有统计完全，更多要依赖 Metrics 和 Bvar 统计的各种元数据 Counter 进行分析。

其中进程内存因为取自系统，可以认为是完全准确的，其他 Memory Tracker 记录的内存因为实现上的局限性，和真实内存之间存在一定的误差，此外 Memory Tracker 记录的是虚拟内存，而不是通常更关注的物理内存，这也影响着 Memory Tracker 的可信度，不过大多数情况下 Doris 虚拟内存和物理内存间的差值很小，所以无需关注，有关 Memory Tracker 误差xxx的分析见xxx

## 查看实时统计结果

实时的内存统计结果通过 Doris BE 的 Web 页面查看 `http://{be_host}:{be_web_server_port}/mem_tracker`（webserver_port默认8040）。

### 首页 `http://{be_host}:{be_web_server_port}/mem_tracker`
![image](https://github.com/apache/doris/assets/13197424/f989f4d2-4cc5-4a8e-880e-93ae6073d17d)
展示 `type=overview` 的 Memory Tracker，包括 Query/Load/Compaction/Global 等几部分，分别展示它们当前使用的内存和峰值内存。

1. Label: Memory Tracker 的名称
- process resident memory: 进程物理内存，Current Consumption 取自 VmRSS in `/proc/self/status`，Peak Consumption 取自 VmHWM in `/proc/self/status`。
- process virtual memory: 进程虚拟内存，Current Consumption 取自 VmSize in `/proc/self/status`，Peak Consumption 取自 VmPeak in `/proc/self/status`。
- sum of all trackers: 包含所有从 `Doris Allocator` 分配的虚拟内存，以及通用内存分配器 TCMalloc 或 Jemalloc 的 Cache 和 Metadata，以及一些由手动跟踪的没有使用 `Doris Allocator` 分配的内存。即除`process resident memory`和`process virtual memory`外，其他 `type=overview` Memory Tracker 的 Current Consumption 总和。
- global: 所有从 `Doris Allocator` 分配的全局内存总和，包括 Cache、元数据、解压缩 等生命周期和进程相同的全局 Memory Tracker。
- tc/jemalloc_cache: 通用内存分配器 TCMalloc 或 Jemalloc 的缓存。Doris 默认使用 Jemalloc，Jemalloc 自身占用的内存包括 Thread Cache、Dirty Page、Metadata 三部分，其中Jemalloc 缓存包括 Dirty Page、Thread Cache 两部分，在 http://{be_host}:{be_web_server_port}/memz 可以实时查看到内存分配器原始的profile。
- tc/jemalloc_metadata: 通用内存分配器 TCMalloc 或 Jemalloc 的 Metadata，在 http://{be_host}:{be_web_server_port}/memz 可以实时查看到内存分配器原始的profile。
- reserved_memory: 被预留的内存，查询在构建 Hash Table 等需要大内存的行为之前，会先从 Memory Tracker 中预留出所构建 Hash Table 大小的内存，确保后续内存申请能够满足。
- query: 所有查询从 `Doris Allocator` 分配的内存总和，即所有 Query Memory Tracker 的 Current Consumption 总和。
- load: 所有导入从 `Doris Allocator` 分配的内存总和，即所有 Load Memory Tracker 的 Current Consumption 总和。
- compaction: 所有 Compaction 任务从 `Doris Allocator` 分配的内存总和，即所有 Compaction Memory Tracker 的 Current Consumption 总和。
- schema_change: 所有 Schema Change 任务从 `Doris Allocator` 分配的内存总和，即所有 Schema Change Memory Tracker 的 Current Consumption 总和。
- other: 除上述之外其他任务从 `Doris Allocator` 分配的内存总和，例如 EngineAlterTabletTask、EngineCloneTask、CloudEngineCalcDeleteBitmapTask、SnapshotManager 等。

2. Current Consumption(Bytes): 当前内存值，单位 B。
3. Current Consumption(Normalize): 当前内存值的 .G.M.K 格式化输出。
4. Peak Consumption(Bytes): BE 进程启动后的内存峰值，单位 B，BE 重启后重置。
5. Peak Consumption(Normalize): BE 进程启动后内存峰值的 .G.M.K 格式化输出，BE 重启后重置。

`type=overview` 的 Memory Tracker 中，除 `process resident memory`、`process virtual memory`、`sum of all trackers` 外，其他 Tracker 都可以使用 Lable `/mem_tracker?type=Lable` 查看详情。

### Global Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=global`
![image](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)
展示 `type=global` 的 Memory Tracker。

Parent Label: 用于表明两个 Memory Tracker 的父子关系，Child Tracker 记录的内存是 Parent Tracker 的子集，Parent 相同的不同 Tracker 记录的内存可能存在交集。

- Orphan: 收集无主的内存，理想情况下预期等于0，Current Consumption 为正数或负数都意味着 `Doris Allocator` 分配的内存跟踪不准，Consumption 越大，意味着 Memory Tracker 统计结果的可信度越低。其来源有二：1. TLS 中没有绑定 Memory Tracker，`Doris Allocator` 默认将内存记录到 Orphan 中；2. Memory Tracker 析构时如果 Current Consumption 不等于0，通常意味着这部分内存没有释放，将把这部分剩余的内存记录到 Orphan 中。
- DataPageCache\[size\](AllocByAllocator): 用于缓存数据 Page，用于加速 Scan。`[size]` 意味着 Tracker 记录的是内存大小，`(AllocByAllocator)` 意味着 Tracker 的值由 `Doris Allocator` 记录。
- IndexPageCache\[size\](AllocByAllocator): 用于缓存数据 Page 的索引，用于加速 Scan。
- PKIndexPageCache\[size\](AllocByAllocator): 用于缓存 Page 的主键索引，用于加速 Scan。
- DetailsTrackerSet:
    包含一些由手动跟踪的没有使用 `Doris Allocator` 分配的内存，包括由各种 `ProtoBuffer` 组成的元数据内存、BRPC内存等，默认只展示 Peak Consumption 不等于 0 的 Memory Tracker。
    - SegmentCache[size]: 缓存已打开的 Segment 的内存大小，如索引信息。
    - SchemaCache[number]: 缓存 Rowset Schema 的条目数, `[number]` 意味着 Tracker 记录的是缓存的条目数。
    - TabletSchemaCache[number]: 缓存 Tablet Schema 的条目数。
    - TabletMeta(experimental): 所有 Tablet Schema 的内存大小，`(experimental)`意味着这个 Memory Tracker 还处于实验中，值可能不准确。
    - CreateTabletRRIdxCache[number]: 缓存 create tabelt 索引的条目数。
    - PageNoCache: 如果关闭了 page cache, 这个 Memory Trakcer 将跟踪所有 Query 使用的所有 page 内存总和。
    - IOBufBlockMemory: BRPC 使用的 IOBuf 内存总和。
    - PointQueryLookupConnectionCache[number]: 缓存的 Point Query Lookup Connection 条目数。
    - AllMemTableMemory: 所有导入在内存中缓存等待下刷的 Memtable 内存总和，
    - MowTabletVersionCache[number]: 缓存的 Mow Tablet Version 条目数。
    - MowDeleteBitmapAggCache[size]: 缓存的 Mow DeleteBitmap 内存大小。
- SegCompaction: 所有 SegCompaction 任务从 `Doris Allocator` 分配的内存总和。
- PointQueryExecutor: 所有 Point Query 共享的一些从 `Doris Allocator` 分配的内存。
- BlockCompression: 所有 Query 共享的一些解压缩过程中从 `Doris Allocator` 分配的内存。
- RowIdStorageReader: 所有 multiget data 请求在 RowIdStorageReader 中使用的从 `Doris Allocator` 分配的内存。
- SubcolumnsTree: Point Query 在 SubcolumnsTree 中使用的一些从 `Doris Allocator` 分配的内存。
- S3FileBuffer: 读取 S3 时 File Buffer 中一些从 `Doris Allocator` 分配的内存。

### Query Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=query`
![image](https://github.com/apache/doris/assets/13197424/3adac2fc-9f20-4c0f-9c84-4439cebd101c)
展示 `type=query` 的 Memory Tracker。

- `Query#Id=QueryID`
  Label 以 `Query#Id=` 开头的 Memory Tracker 每个 Query 唯一，是这个 Query 从 `Doris Allocator` 分配的内存总和。
  Limit: 单个查询使用的内存上限，`show session variables`查看和修改`exec_mem_limit`。
- Parent Label 是 `Query#Id=QueryID` 的 Memory Tracker 记录着这个查询执行过程中不同算子使用的内存，是 Query Memory Tracker 的子集。

### Load Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=load`
![image](https://github.com/apache/doris/assets/13197424/767d2404-7a29-4fed-96f8-bf5c8575e7dd)
展示 `type=load` 的 Memory Tracker。

- `Load#Id=LoadID`
  Label 以 `Load#Id=` 开头的 Memory Tracker 每个 Load 唯一，是这个 Load 从 `Doris Allocator` 分配的内存总和。
  Limit: 单个 Load 使用的内存上限，`show session variables`查看和修改`exec_mem_limit`。
- Parent Label 是 `Load#Id=LoadID` 的 Memory Tracker 记录着这个 Load Fragment 执行过程中不同算子使用的内存，是 Load Memory Tracker 的子集。
- MemTableManualInsert:TabletId=248915:MemTableNum=1#loadID=LoadID	: 一个 MemTable insert阶段分配的内存，是 Load Memory Tracker 的子集。
- MemTableHookFlush:TabletId=248891:MemTableNum=1#loadID=LoadID: 一个 MemTable flush过程中分配的内存，是 Load Memory Tracker 的子集。
- MemTableTrackerSet: 所有 MemTable Memory Tracker 的公共 Parent Tracker，没有实际值，因为 MemTable insert 和 flush 阶段可能和 Load Fragment 不在一台 BE 节点上。

## Memory Tracker 结构

根据使用方式 Memory Tracker 分为两类，第一类 Memory Tracker Limiter，在每个查询、导入、Compaction 等任务和全局 Cache、TabletMeta 唯一，用于观测和控制内存使用；第二类 Memory Tracker，主要用于跟踪查询执行过程中的内存热点，如 Join/Aggregation/Sort/窗口函数中的 HashTable、序列化的中间数据等，来分析查询中不同算子的内存使用情况，以及用于导入数据下刷的内存控制。

二者之间的父子关系只用于快照的打印，使用Lable名称关联，相当于一层软链接，不依赖父子关系同时消费，生命周期互不影响，减少理解和使用的成本。所有 Memory Tracker 存放在一组 Map 中，并提供打印所有 Memory Tracker Type 的快照、打印 Query/Load/Compaction  等 Task 的快照、获取当前使用内存最多的一组 Query/Load、获取当前过量使用内存最多的一组 Query/Load 等方法。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker 内存占用过大分析

上面介绍了通过 Doris BE 的 Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker` 实时查看内存统计结果，除此之外当报错进程内存超限或可用内存不足时，在 `be/log/be.INFO` 日志中可以找到 `Memory Tracker Summary`，包含所有 `Type=overview` 和 `Type=global` 的 Memory Tracker，帮助使用者分析当时的内存状态，有关内存日志的分析参考 [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis) 中 [进程可用内存不足] 章节。

下面分析不同 Memory Tracker 内存占用过大的原因以及减少其内存使用的方法，有关 Memory Tracker 每一部分的含义参考上面 [查看实时统计结果] 中的解释。

### 1 `Label=query, Type=overview` 查询内存占用多

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

首先定位大内存查询的 QueryID，在 BE web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` 中按照 `Current Consumption` 排序可以看到实时的大内存查询，在 `label` 中可以找到 QueryID。

当报错进程内存超限或可用内存不足时，在 `be.INFO` 日志中 `Memory Tracker Summary` 下半部分包含内存使用 TOP 10 的任务（查询/导入/Compaction等）的 Memory Tracker，格式为 `MemTrackerLimiter Label=Query#Id=xxx, Type=query`，通常在 TOP 10 的任务中就能定位到大内存查询的 QueryID。

在定位到大内存查询的 QueryID 后，参考 [Memory Analyze Manual](./memory-analyze-manual) 中 [查询内存分析] 分析查询的内存使用。

历史查询的内存统计结果可以查看`fe/log/fe.audit.log`中每个查询的`peakMemoryBytes`，或者在`be/log/be.INFO`中搜索`Deregister query/load memory tracker, queryId`查看单个BE上每个查询的内存峰值。

### 2 `Label=load, Type=overview` 或  `Label=AllMemTableMemory` 导入内存使用多

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Doris 导入的内存分为两部分，第一部分是 Fragment 执行使用的内存，第二部分是 `MemTable` 的构造和下刷过程中使用的内存。

BE web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` 中找到 `Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` 的 Memory Tracker 是这台 BE 结点上所有导入任务构造和下刷 `MemTable` 使用的内存。报错进程内存超限或可用内存不足时，在 `be.INFO` 日志中 `Memory Tracker Summary` 也可以找到这个 Memory Tracker。

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

如果 ``Label=AllMemTableMemory` 的值很小，则导入任务主要使用内存的位置是执行 Fragment，分析方式和上面对 `Label=query` 查询内存分析相同，此处不再赘述。

如果 ``Label=AllMemTableMemory` 的值很大，则可能 `MemTable` 下刷不及时，可以考虑减小 `be.conf` 中 `load_process_max_memory_limit_percent` 和 `load_process_soft_mem_limit_percent` 的值，这可以让 `MemTable` 更频繁的下刷，从而在内存中缓存的 `MemTable` 更少。

在导入执行过程中查看 BE Web 页面 `/mem_tracker?type=load`，依据 `Label=MemTableManualInsert` 和 `Label=MemTableHookFlush` 两组 Memory Tracker 的值，可以定位 `MemTable` 内存使用大的 `LoadID` 和 `TabltID`。

### 3 `Label=tc/jemalloc_cache, Type=overview` Jemalloc 或 TCMalloc Cache 内存使用多

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Doris 2.1.6 之前 `Label=tc/jemalloc_cache` 还包括 Jemalloc Metadata，而且大概率是因为 Jemalloc Metadata 内存占用大导致 `Label=tc/jemalloc_cache` 过大，参考对 `Label=tc/jemalloc_metadata` Memory Tracker 的分析。

Doris 使用 Jemalloc 作为默认的 Allocator，所以这里只分析 Jemalloc Cache 内存使用多的情况。

BE 进程运行过程中，Jemalloc Cache 包括两部分。
- Thread Cache，在 Thread Cache 中缓存指定数量的 Page，参考 [Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache)。
- Dirty Page，所有 Arena 中可以被复用的内存 Page。

查看 Doris BE 的 Web 页面 `http://{be_host}:{be_web_server_port}/memz`（webserver_port默认8040）可以获得 Jemalloc Profile，根据几组关键信息解读 Jemalloc Cache 的使用。

#### 3.1 如果 Jemalloc Profile 中 `tcache_bytes` 的值较大

Jemalloc Profile 中的 `tcache_bytes`是 Jemalloc Thread Cache 的总字节数。如果 `tcache_bytes` 值较大，说明 Jemalloc Thread Cache 使用的内存过大，可能是 `tcache` 缓存了大量大Page，因为 `tcache` 的上限是 Page 个数，而不是 Page 的总字节数。

考虑减小 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_tcache_max`，`lg_tcache_max` 是允许缓存的 Page 字节大小上限，默认是 15，即 32 KB (2^15)，超过这个大小的 Page 将不会缓存到 `tcache` 中。`lg_tcache_max` 对应 Jemalloc Profile 中的 `Maximum thread-cached size class`。

这通常是 BE 进程中的查询或导入正在申请大量大 size class 的内存 Page，或者执行完一个大内存查询或导入后，`tcache` 中缓存了大量大 size class 的内存 Page，`tcache` 有两个清理时机，一是内存申请和释放到达一定次数时，回收长时间未使用的内存块；二是线程退出时回收全部 `tcache`。此时存在一个 badcase，若线程后续一直没有执行新的查询或导入，从此不再分配内存，陷入一种所谓的 idle 状态。用户预期是查询结束后，内存是可以释放掉的，但实际上此场景下若线程没有退出，`tcache` 并不会清理。

不过通常无需关注 Thread Cache，在进程可用内存不足时，若 Thread Cache 的大小超过 1G，Doris将手动 Flush Thread Cache。

#### 3.2. 如果 Jemalloc Profile 中 `extents` 表中 `dirty` 列的值总和较大

```
extents:        size ind       ndirty        dirty       nmuzzy        muzzy    nretained     retained       ntotal        total
                4096   0            7        28672            1         4096           21        86016           29       118784
                8192   1           11        90112            2        16384           11        90112           24       196608
               12288   2            2        24576            4        49152           45       552960           51       626688
               16384   3            0            0            1        16384            6        98304            7       114688
               20480   4            0            0            1        20480            5       102400            6       122880
               24576   5            0            0           43      1056768            2        49152           45      1105920
               28672   6            0            0            0            0           13       372736           13       372736
               32768   7            0            0            1        32768           13       425984           14       458752
               40960   8            0            0           31      1150976           35      1302528           66      2453504
               49152   9            4       196608            2        98304            3       139264            9       434176
               57344  10            0            0            1        57344            9       512000           10       569344
               65536  11            3       184320            0            0            6       385024            9       569344
               81920  12            2       147456            3       241664           38      2809856           43      3198976
               98304  13            0            0            1        86016            6       557056            7       643072
              114688  14            1       102400            1       106496           15      1642496           17      185139
```

减小 `be.conf` 中 `JEMALLOC_CONF` 的 `dirty_decay_ms` 到 2000 ms 或更小，`be.conf` 中默认 `dirty_decay_ms` 为 5000 ms。Jemalloc 会在 `dirty_decay_ms` 指定的时间内依照平滑梯度曲线释放 Dirty Page，参考 [Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms)，当 BE 进程可用内存不足触发 Minor GC 或 Full GC 时会按照一定策略主动释放所有 Dirty Page。

Jemalloc Profile 中的 `extents` 包含 Jemalloc 所有 `arena` 中不同 Page Size 的 bucket 的统计值，其中 `ndirty` 是 Dirty Page 的个数，`dirty` 是 Dirty Page 的内存总和。参考 [Jemalloc](https://jemalloc.net/jemalloc.3.html) 中的 `stats.arenas.<i>.extents.<j>.{extent_type}_bytes` 将所有 Page Size 的 `dirty` 相加得到 Jemalloc 中 Dirty Page 的内存字节大小。

### 4 `Label=tc/jemalloc_metadata, Type=overview` Jemalloc 或 TCMalloc Metadata 内存使用多

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` Memory Tracker 在 Doris 2.1.6 之后才被添加，过去 Jemalloc Metadata 被包含在 `Label=tc/jemalloc_cache` 中。

Doris 使用 Jemalloc 作为默认的 Allocator，所以这里只分析 Jemalloc Metadata 内存使用多的情况。

查看 Doris BE 的 Web 页面 `http://{be_host}:{be_web_server_port}/memz`（webserver_port默认8040）可以获得 Jemalloc Profile，查找 Jemalloc Profile 中关于 Jemalloc 整体的内存统计如下，其中 `metadata` 就是 Jemalloc Metadata 的内存大小。

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`
- `Allocated` Jemalloc 为 BE 进程分配的内存总字节数。
- `active` Jemalloc 为 BE 进程分配的所有 Page 总字节数，是 Page Size 的倍数，通常大于等于 `Allocated`。
- `metadata` Jemalloc 的元数据总字节数，和分配和缓存的 Page 个数、内存碎片 等因素都有关，参考文档 [Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata)
- `retained` Jemalloc 保留的虚拟内存映射大小，也没有通过munmap或类似方法返回给操作系统，也没有强关联物理内存。参考文档 [Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained)

Jemalloc Metadata 大小和进程虚拟内存大小正相关，通常 Doris BE 进程虚拟内存大是因为 Jemalloc 保留了大量虚拟内存映射，即上面的 `retained`。返回给 Jemalloc 的虚拟内存默认都会缓存在 Retained 中，等待被复用，不会自动释放，也无法手动释放。

造成 Jemalloc Retained 大的根本原因是 Doris 代码层面内存复用不足，导致需要申请大量虚拟内存，这些虚拟内存释放后进入 Jemalloc Retained。通常虚拟内存和 Jemalloc Metadata 大小的比值在 300-500 之间，即若有 10T 的虚拟内存，Jemalloc Metadata 可能占用 20G。

如果遇到 Jemalloc Metadata 和 Retained 持续增大，以及进程虚拟内存过大的问题，建议考虑每周或每月定时重启 Doris BE，通常这只会在 Doris BE 长时间运行后出现，而且只有少数 Doris 集群会遇到。目前没有不损失性能的方法降低 Jemalloc Retained 保留的虚拟内存映射，Doris 正在持续优化内存使用。

如果频繁出现上述问题，参考下面的方法。
1. 一个根本解决方法是关闭 Jemalloc Retained 缓存虚拟内存映射，在 `be.conf` 中 `JEMALLOC_CONF` 后面增加 `retain:false` 后重启 BE。但查询性能可能会明显降低，测试 TPC-H benchmark 性能会降低 3 倍左右。
2. Doris 2.1上可以关闭 pipelinex 和 pipeline，执行 `set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`，因为 pipelinex 和 pipeline 会申请更多的虚拟内存。这同样会导致查询性能降低。

### 5 `Label=global, Type=overview` Global 内存使用多

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

`Label=global, Type=overview` 的值等于 `Memory Tracker Summary` 中所有 `Type=global` 且 `Parent Label != DetailsTrackerSet` 的 Memory Tracker 之和，Global 内存主要包括 Cache 和元数据等在不同任务间共享的内存，具体可以参考 [Memory Tracker](./memory-tracker.md) 中对 `type=global` 的介绍。

Doris BE 运行时存在各种 Cache，通常无需关注 Cache 内存，因为在 BE 进程可用内存不足时会触发内存 GC 首先清理 Cache。但 Cache 过大会增加 Memroy GC 的压力，增加查询或导入报错进程可用内存不足的风险，以及 BE 进程 OOM Crash 的风险，所以如果内存持续紧张，可以考虑优先降低 Cache 的上限、关闭 Cache 或降低 Cache entry 的存活时间，更小的 Cache 在某些场景中可能会降低查询性能，但在生产环境中通常可以被容忍，调整后可以观察一段时间的查询和导入的性能。如果希望在 BE 运行中手动清理所有 Cache，执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`，将返回释放的内存大小。

下面分析常见的 Global Memory Tracker 内存使用多的情况。

#### 5.1 `Label=DataPageCache` 内存使用多

```
MemTrackerLimiter Label=DataPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=198.70 MB(208357157 B), Peak=198.73 MB(208381892 B)
```

缓存数据 Page 的内存大小。

- 执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` 可以在 BE 运行中手动清理。
- 执行 `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true` 对正在运行的 BE 禁用 `DataPageCache`，并默认在最长 10 分钟后清空，但这是临时方法，BE 重启后 `DataPageCache` 将重新生效。
- 若确认要长期减少 `DataPageCache` 的内存使用，参考 [BE 配置项](../../admin-manual/config/be-config.md)，在 `conf/be.conf` 中调小 `storage_page_cache_limit` 减小 `DataPageCache` 的容量，或调小 `data_page_cache_stale_sweep_time_sec` 减小 `DataPageCache` 缓存有效时长，或增加 `disable_storage_page_cache=true` 禁用 `DataPageCache`，然后重启 BE 进程。

#### 5.2 `Label=SegmentCache` 内存使用多

```
MemTracker Label=SegmentCache[size], Parent Label=DetailsTrackerSet, Used=1.64 MB(1720543 B), Peak=18.78 MB(19691997 B)
```

缓存已打开的 Segment 的内存大小。

- 执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` 可以在 BE 运行中手动清理。
- 执行 `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true` 对正在运行的 BE 禁用 `SegmentCache`，并默认在最长 10 分钟后清空，但这是临时方法，BE 重启后 `SegmentCache` 将重新生效。
- 若确认要长期减少 `SegmentCache` 的内存使用，参考 [BE 配置项](../../admin-manual/config/be-config.md)，在 `conf/be.conf` 中调整 `segment_cache_capacity` 或 `segment_cache_memory_percentage` 减小 `SegmentCache` 的容量，或调小 `tablet_rowset_stale_sweep_time_sec` 减小 `SegmentCache` 缓存有效时长，或者在 `conf/be.conf` 中增加 `disable_segment_cache=true` 禁用 `SegmentCache` 并重启 BE 进程。

#### 5.3 `Label=PKIndexPageCache` 内存使用多

```
MemTrackerLimiter Label=PKIndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

缓存数据 Page 主键索引的内存大小.

- 执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` 可以在 BE 运行中手动清理。
- 参考 [BE 配置项](../../admin-manual/config/be-config.md)，在 `conf/be.conf` 中调小 `pk_storage_page_cache_limit` 减小 `PKIndexPageCache` 的容量，或调小 `pk_index_page_cache_stale_sweep_time_sec` 减小 `DataPageCache` 缓存有效时长，或者在 `conf/be.conf` 中增加 `disable_pk_storage_page_cache=true` 禁用 `PKIndexPageCache`，然后重启 BE 进程。

#### 5.4 `Label=Orphan` 内存使用多

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

`Orphan` 是 `Doris Allocator` 默认使用的 Memory Tracker，如果线程开始时没有 Attach 其他的 Memory Tracker，那么默认情况下 `Doris Allocator` 会将分配的内存记录到 Orphan Memory Tracker 中，所以 `Orphan Memory Tracker Consumption` 加 `Othre Memory Tracker Limiter Consumption` 等于 `Doris Allocator` 分配出去的所有内存。

具体有关跟踪 `Doris Allocator` 内存分配的原理可以参考 [Memory Tracker](./memory-tracker.md)，理想情况下，我们希望所有线程开始时都 Attach 一个 Orphan 之外的 Memory Tracker，所以期望 `Orphan Memory Tracker Consumption` 的值接近0。

> Doris 2.1.5 之前 SegmentCache 内存实际统计在 Orphan Memory Tracker 中，且没有得到有效限制，经常导致 Orphan Memory Tracker 的值过大。所以在 Doris 2.1.5 之前发现 Orphan Memory Tracker 值过大时，优先参考 `Label=SegmentCache 内存使用多` 章节关闭 SegmentCache。

### 6 `Label=process virtual memory, Type=overview` 进程虚拟内存过大

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```

通常 Doris BE 进程虚拟内存大是因为 Jemalloc 保留了大量虚拟内存映射，可以参考对 `Label=tc/jemalloc_metadata` Memory Tracker 的分析。
