---
{
    "title": "内存分析手册",
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

Doris BE 进程内存分析主要使用 `be/log/be.INFO` 日志、BE 进程内存监控、Doris Bvar 统计结果，如果触发了 OOM Killer 需要收集 `dmesg -T` 执行结果，如果分析查询内存需要收集 Query Profile，这篇文章依据这些信息分析常见的内存问题，如果你自行分析无法解决问题，需要向 Doris 开发者们求助，途径不限于在 Github 提交 issue、在 Doris 论坛创建问题、使用邮件或 WeChat 联系我们，请将上述信息一并提供给我们。

## 1 进程内存状态日志分析

Doris BE 进程内存每次增长或减少 256 MB 都会在 `log/be.INFO` 日志打印一次进程内存状态，另外进程内存不足时，也会随其他日志一起打印进程内存状态。

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```

1. `os physical memory 375.81 GB` 指系统物理内存 375.81 GB。

2. `process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh])`
- 当前我们认为 BE 进程使用了 4.09 GB 内存，实际 BE 进程使用的物理内存 `vm/rss` 是 3.49 GB，
- 其中有 410.44 MB 是 `tc/jemalloc_cache`，这部分 Cache 会在之后执行过程中被优先复用，所以这里不将其算作 BE 进程内存。
- `reserved` 是在执行过程中被预留的内存，通常在构建 HashTable 等会耗费大量内存的操作前会提前预留 HashTable 的内存，确保构建 HashTable 的过程不会因为内存不足而终止，这部分预留的内存被计算在 BE 进程内存中，即使实际上还没有被分配。
- `waiting_refresh` 是两次内存状态刷新的间隔中申请的大内存，Doris 内存状态刷新的间隔默认是 100ms，为避免两次内存状态刷新的间隔中发生大量内存申请，在内存超限后没有及时感知和触发内存 GC，所以间隔中申请的大内存被计算在 BE 进程内存中，每次内存状态刷新后`waiting_refresh`都将清0，

3. `sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh])`
- 当前 BE 进程剩余可使用的内存是 134.41 GB，系统中实际可提供给 BE 进程使用的内存 `proc/available` 是 135.41 GB.
- 其中有 1GB 的内存已经被预留，所以在计算 BE 进程剩余可用内存时减去 `reserved`，关于 `reserved` 和 `waiting_refresh` 的介绍参考上面对 BE 进程内存的注解。

4. `limit 3.01 GB, soft limit 2.71 GB` 和 `low water mark 3.20 GB, warning water mark 6.40 GB`，有关 MemLimit 和 WaterMark 的更多介绍见 [内存限制和水位线计算方法]。

## 2 BE 进程触发 OOM Killer 分析

如果 BE 进程 Crash 后 `log/be.out` 中没有报错信息，执行 `dmesg -T` 如果看到下面的日志，说明触发了 OOM Killer，可见 `20240718 15:03:59` 时 doris_be 进程物理内存（anon-rss）约 60 GB。

```
[Thu Jul 18 15:03:59 2024] oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=init.scope,mems_allowed=0,global_oom,task_memcg=/user.slice/user-0.slice/session-1093.scope,task=doris_be,pid=360303,uid=0
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

理想情况下，Doris 会定时检测操作系统剩余可用内存，并在内存不足时采取包括阻止后续内存申请、触发内存 GC 在内的一系列操作来避免触发 OOM Killer，但刷新内存状态和内存 GC 都具有一定的滞后性，并且很难完全 Catch 所有大内存申请，在集群压力过大时仍有一定几率触发 OOM Killer，导致 BE 进程 Crash。此外如果进程内存状态异常，导致内存 GC 无法释放内存，导致进程实际可用内存减少，这将加剧集群的内存压力。

如果不幸触发了 OOM Killer，首先依据日志分析 BE 进程触发 OOM Killer 前的内存状态和任务执行情况，然后针对性调参让集群恢复稳定。

### 2.1 找到触发 OOM Killer 时间点前的内存日志

触发 OOM Killer 时意味着进程可用内存不足，参考 [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis) 中 [分析内存日志，定位进程内存位置并考虑减少内存使用] 的章节在 `be/log/be.INFO` 触发 OOM Killer 时间点自下而上找到最后一次打印的 `Memory Tracker Summary` 关键词并分析，找到 BE 进程的主要内存位置。

> `less be/log/be.INFO` 打开文件后，首先跳转到触发 OOM Killer 对应时间的日志，以上面 `dmesg -T` 的结果为例，输入 `/20240718 15:03:59` 后回车搜索对应时间，如果搜不到，可能是触发 OOM Killer 的时间有些偏差，可以搜索 `/20240718 15:03:`。 日志跳转到对应时间后，输入 `/Memory Tracker Summary` 后回车搜素关键词，默认会在日志向下搜索，如果搜索不到或时间对应不上，需要 `shift + n` 先上搜索，找到最后一次打印的 `Memory Tracker Summary` 以及同时打印的 `Process Memory Summary` 内存日志。

### 2.2 集群内存压力过大导致触发 OOM Killer

若满足如下现象，那么可以认为是集群内存压力过大，导致在某一时刻进程内存状态没有及时刷新，内存 GC 没能及时释放内存，导致没能有效控制 BE 进程内存。
- 对 `Memory Tracker Summary` 的分析发现查询和其他任务、各个Cache、元数据等内存使用都合理。
- 对应时间段的 BE 进程内存监控显示长时间维持在较高的内存使用率，不存在内存泄漏的迹象
- 定位 `be/log/be.INFO` 中 OOM Killer 时间点前的内存日志，自下而上搜索 `GC` 关键字，发现 BE 进程频繁执行内存 GC。

此时参考 [BE 配置项](../../admin-manual/config/be-config) 在`be/conf/be.conf`中调小`mem_limit`，调大 `max_sys_mem_available_low_water_mark_bytes`，有关内存限制和水位线计算方法、内存 GC 的更多介绍见 [Memory Management Features](./memory-management-feature)。此外还可以调节其他参数控制内存状态刷新和 GC，包括 `memory_gc_sleep_time_ms`，`soft_mem_limit_frac`，`memory_maintenance_sleep_time_ms`，`process_minor_gc_size`，`process_full_gc_size`，`enable_query_memory_overcommit`，`thread_wait_gc_max_milliseconds` 等。

若不满足上述现象，那么认为此时内存状态异常，内存 GC 可能无法及时释放内存，下面列举一些常见的异常场景导致触发 OOM Killer。

### 2.2 一些异常场景导致触发 OOM Killer

1. `Label=process resident memory` 减去 `Label=sum of all trackers` 的差值较大

参考 [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis) 中 [若 `Label=sum of all trackers` 的值占到 `Label=process resident memory` 的 70% 以下] 章节进行分析。

2. Query Cancel 过程中卡住（常见于 Doris 2.1.3 之前）

定位 `be/log/be.INFO` 中 OOM Killer 时间点前的内存日志，自下而上找到最后一次打印的 `tasks is being canceled and has not been completed yet` 关键词，这行日志表示存在 Query 正在被 Cancel 但没有 Cancel 完成。如果其后的 QueryID 列表不为空，执行 `grep queryID be/log/be.INFO` 确认 Query 的开始时间和触发 Cancel 的时间，若触发 Cancel 的时间和 OOM Killer 的时间间隔较长（大于3s），那么说明 Query Cancel 过程中卡住，进一步分析 Query 执行日志。

3. Jemalloc Metadata 内存占用大

内存 GC 目前无法释放 Jemalloc Metadata，参考 [Memory Tracker](./memory-tracker.md) 中对 `Label=tc/jemalloc_metadata` Memory Tracker 的分析，减少内存使用。

4. Jemalloc Cache 内存占用大（常见于 Doris 2.0）

Doris 2.0 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_tcache_max` 默认值是 20，这在某些场景会导致 Jemalloc Cache 太大且无法自动释放，考 [Memory Tracker](./memory-tracker.md) 中对 `Label=tc/jemalloc_cache` Memory Tracker 的分析，减少内存使用。

5. `Label=Orphan` Memory Tracker 内存占用大（仅限于 Doris 2.0）

Doris 2.0 之前将不知所属的内存都统计到 `Label=Orphan` Memory Tracker 中，`Label=Orphan` Memory Tracker 内存占用大意味着 Memory Tracker 统计缺失，分析方法和上文中对 Doris 2.1 之后 [`Label=process resident memory` 减去 `Label=sum of all trackers` 的差值较大] 对分析相同。

## 3 查询内存分析

通常先使用 Query Profile 分析查询内存使用，如果 Query Profile 中统计的各个算子（Operator）内存之和远小于 Query Memory Trcker 统计到的内存，说明 Query Profile 统计到的算子内存与实际使用的内存相差较大，那么往往还需要使用 Heap Profile 进一步分析。如果 Query 因为内存超限被 Cancel，无法执行完成，此时 Query Profile 不完整，可能无法准确分析，通常直接使用 Heap Profile 分析 Query 内存使用。

### 3.1 使用 Query Profile 分析查询内存使用

1. 定位使用大量内存的 Operator 或内存数据结构

依据 QueryID 在 `fe/log/fe.audit.log` 中找到包括 SQL 在内的查询信息，`explain SQL` 得到查询计划，`set enable_profile=true`后执行 SQL 得到查询的 Query Profile，有关 Query Profile 的详细介绍参考文档 [Query Profile](../../query/query-analysis/query-profile.md)，这里只介绍 Query Profile 中内存相关的内容，并据此定位使用大量内存的 Operator 和数据结构。

Query Profile 分为两部分:

- `MergedProfile` 

MergedProfile 是 Query 所有 Instance Profile 的聚合结果，其中能看到每个 Fragment 的每个 Pipeline 的每个 Operator(算子) 在所有 Instance 上内存使用的 sum、avg、max、min，包括 Operator 的峰值内存 `PeakMemoryUsage` 以及 `HashTable`、`Arena` 等主要内存数据结构的峰值内存，据此定位到使用了大量内存的 Operator 和 数据结构。

```
MergedProfile  
          Fragments:
              Fragment  0:
                  Pipeline  :  0(instance_num=1):
                      RESULT_SINK_OPERATOR  (id=0):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                          EXCHANGE_OPERATOR  (id=20):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  1.16  KB,  avg  1.16  KB,  max  1.16  KB,  min  1.16  KB
              Fragment  1:
                  Pipeline  :  1(instance_num=12):
                      AGGREGATION_SINK_OPERATOR  (id=18  ,  nereids_id=1532):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                -  HashTable:  sum  96.00  B,  avg  8.00  B,  max  24.00  B,  min  0.00  
                                -  PeakMemoryUsage:  sum  1.58  MB,  avg  134.67  KB,  max  404.02  KB,  min  0.00  
                                -  SerializeKeyArena:  sum  1.58  MB,  avg  134.67  KB,  max  404.00  KB,  min  0.00  
                          EXCHANGE_OPERATOR  (id=17):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  2.25  KB,  avg  192.00  B,  max  768.00  B,  min  0.00
```

- `Execution  Profile`

`Execution  Profile` 是 Query 具体每个 Instance Profile 的结果，通常依据 `MergedProfile` 定位到使用了大量内存的 Operator 和数据结构后，即可依据 `explain SQL` 后的查询计划分析其内存使用的原因，如果一些场景下需要分析 Query 在某一个 BE 结点或某一个 Instance 的内存值，可以依据 `Execution  Profile` 进一步定位。

```
Execution  Profile  36ca4f8b97834449-acae910fbee8c670:(ExecTime:  48sec201ms)
    Fragments:
        Fragment  0:
            Fragment  Level  Profile:    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):(ExecTime:  48sec111ms)
            Pipeline  :1    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):
                PipelineTask  (index=80):(ExecTime:  6sec267ms)
                DATA_STREAM_SINK_OPERATOR  (id=17,dst_id=17):(ExecTime:  1.634ms)
                -  MemoryUsage:  
                    -  PeakMemoryUsage:  1.50  KB
                STREAMING_AGGREGATION_OPERATOR  (id=16  ,  nereids_id=1526):(ExecTime:  41.269ms)
                    -  MemoryUsage:  
                        -  HashTable:  168.00  B
                        -  PeakMemoryUsage:  404.16  KB
                        -  SerializeKeyArena:  404.00  KB
                HASH_JOIN_OPERATOR  (id=15  ,  nereids_id=1520):(ExecTime:  6sec150ms)
                        -  MemoryUsage:  
                            -  PeakMemoryUsage:  3.22  KB
                            -  ProbeKeyArena:  3.22  KB
                    LOCAL_EXCHANGE_OPERATOR  (PASSTHROUGH)  (id=-12):(ExecTime:  67.950ms)
                            -  MemoryUsage:  
                                -  PeakMemoryUsage:  1.41  MB
```

2. `HASH_JOIN_SINK_OPERATOR` 内存占用多

```
HASH_JOIN_SINK_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  1min14sec)
    -  JoinType:  INNER_JOIN
    -  BroadcastJoin:  true
    -  BuildRows:  600.030257M  (600030257)
    -  InputRows:  600.030256M  (600030256)
    -  MemoryUsage:  
        -  BuildBlocks:  15.65  GB
        -  BuildKeyArena:  0.00  
        -  HashTable:  6.24  GB
        -  PeakMemoryUsage:  21.89 GB
```

可见主要使用内存的 Hash Join Build 阶段的 `BuildBlocks` 和 `HashTable`，通常 Hash Join 的 Build 阶段使用内存太多，首先确认 Join Reorder 顺序是否合理，通常正确的顺序是小表用于 Hash Join Build，大表用于 Hash Join Probe，这样可以最小化 Hash Join 整体的内存使用，并通常具有更好的性能。

为了确认 Join Reorder 顺序是否合理，我们找到 id=12 的 `HASH_JOIN_OPERATOR` 的 profile，可以看到 `ProbeRows` 只有 196240 行，所以这个 Hash Join Reorder 正确的顺序应该交换左表和右表的位置，可以 `set disable_join_reorder=true` 关闭 Join Reorder 并手动指定左表和右表的顺序后执行 Query 验证，进一步可参考查询优化器中 Join Reorder 相关的文档。

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

### 3.2 使用 Heap Profile 分析查询内存使用

如果上面使用 Query Profile 无法准确定位内存的使用位置，可以使用 Jemalloc 或 TCMalloc 的 Heap Profile 分析 Query 的内存使用。

Doris 使用 Jemalloc 作为默认的 Allocator，有关 Jemalloc Heap Profile 的使用方法参考文档 [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)。

在 Query 执行前 Dump 一次 Heap Profile，在 Query 执行过程中再 Dump 一次 Heap Profile，通过使用 `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2` 对比两个 Heap Profile 之间的内存变化，可以得出代码中的每个函数在 Query 执行过程中使用的内存占比，对照代码即可定位内存使用位置，因为 Query 执行过程中内存实时变化，所以可能需要在 Query 执行过程中多次 Dump Heap Profile 并对比分析。

## 4 元数据内存分析

Doris BE 在内存中的元数据包括 `Tablet`、`Rowset`、`Segment`、`TabletSchema`、`ColumnReader`、`PrimaryKeyIndex`、`BloomFilterIndex` 等数据结构，有关 Doris BE 元数据的更多介绍参考文档[Doris存储结构设计解析](https://blog.csdn.net/ucanuup_/article/details/115004829)。

目前没有准确统计 Doris BE 的元数据内存大小，所以在 Memory Tracker 中看不到它，通过查看 `Bvar` 和 `metrics` 中的一些 Counter 去估算元数据内存大小。或者使用 Heap Profile 分析时如果在内存占比大的调用栈中看到 `Segment`，`TabletSchema`、`ColumnReader` 字段，说明元数据占用内存大。

`Bvar` 查看方法：`{be_host}:{be_brpc_port}/vars`，下面介绍相关指标。

- `doris_total_tablet_num`：所有 Tablet 的数量。
- `doris_total_rowset_num`：所有 Rowset 的数量。
- `doris_total_segment_num`：所有打开的 Segment 数量
- `doris_total_tablet_schema_num`：所有 Tablet Schema 的数量。
- `tablet_schema_cache_count`：Tablet Schema 被 Cache 的数量
- `tablet_meta_schema_columns_count`：所有 Tablet Schema 中 Column 的数量。
- `tablet_schema_cache_columns_count`：Tablet Schema 中 Column 被 Cache 的数量。
- `doris_column_reader_num`：打开的 Column Reader 数量。
- `doris_column_reader_memory_bytes`：打开的 Column Reader 占用内存的字节数。
- `doris_ordinal_index_memory_bytes`：打开的 Ordinal Index 占用内存的字节数。
- `doris_zone_map_memory_bytes`：打开的 ZoneMap Index 占用内存的字节数。
- `doris_short_key_index_memory_bytes`：打开的 Short Key Index 占用内存的字节数。
- `doris_pk/index_reader_bytes`：累计的 Primary Key Index Reader 占用内存的字节数，这不是实时的统计值，期待被修复。
- `doris_pk/index_reader_pages`：同上，统计的累计值。
- `doris_pk/index_reader_cached_pages`：同上，统计的累计值。
- `doris_pk/index_reader_pagindex_reader_pk_pageses`：同上，统计的累计值。
- `doris_primary_key_index_memory_bytes`：同上，统计的累计值。

`metrics` 查看方法：`{be_host}:{be_web_server_port}/metrics`，包含 Cache 的统计指标。

- `doris_be_cache_usage{name="TabletSchemaCache"}`：Tablet Schema Cache 缓存的元素个数。
- `doris_be_cache_usage{name="SegmentCache"}`：Segment Cache 缓存的元素个数。
- `doris_be_cache_usage{name="SchemaCache"}`：Schema Cache 缓存的元素个数。

下面列举了几种常见的元数据内存过大的现象和原因。

### 4.1 BE 进程刚启动后进程内存就过大

这通常是因为 BE 进程启动时加载的元数据内存过大，查看 `Bvar`。

- 如果 `doris_total_tablet_num` 过多，通常是因为表的分区和分桶数量过多，查看 `{fe_host}:{fe_http_port}/System?path=//dbs` 找到 Tablet 数量多的表，一个表的 Tablet 数量等于其分区数量乘以分桶数量，尝试降低其分区和分桶数量。或者删除过时不会被使用的表或分区。
- 如果 `doris_total_rowset_num` 过多，但 Tablet 数量不多，参考 `SHOW-PROC` 文档找到 Rowset 多但 Tablet 不多的表，然后手动触发 Compaction，或者等自动 Compaction 完成，具体参考元数据管理相关文档，通常存在几十万个 Rowset 时，元数据占用几个 GB 是正常现象。
- 如果 `tablet_meta_schema_columns_count` 过大，是 `doris_total_tablet_schema_num` 的成百上千倍，说明集群中存在几百上千列的大宽表，此时相同数量的 Tablet 会占用更多的内存。
- 如果你在 Heap Profile 内存占比大的调用栈中看到 `Tablet`，`TabletSchema` 字段，则基本可以确认是元数据占用了大量内存。

### 4.2 集群运行一段时间后 BE 进程内存不下降

BE 进程内存不下降，当 Memory Tracker 统计缺失导致无法定位内存时，可以首先排查元数据缓存占用的内存。

常见占用内存大的元数据缓存是 Segment Cache，在上面我们分析了 `Label=SegmentCache` Memory Tracker，但包括 Primary Key Index 在内的一些 Index 内存统计的是不准确的，导致 Memory Tracker 不准确。尤其是在成百上千列的大宽表上，如果你发现 `doris_be_cache_usage{name="SegmentCache"}` 不大，但 `doris_column_reader_num` 很大，则需要更加怀疑 Segment Cache 的内存占用。

如果你在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`ColumnReader` 字段，则基本可以确认是 Segment Cache 占用了大量内存。

参考 [BE 配置项](../../admin-manual/config/be-config.md)，在 `conf/be.conf` 中增加 `disable_segment_cache=true` 禁用 `SegmentCache` 并重启 BE 进程。可以参考 [3.5.2. `Label=SegmentCache` 内存使用多] 调整 `SegmentCache` 的使用。

### 4.3. Query 没有复杂算子只是简单的 Scan 数据，却要使用很大的内存

可能是读取 Segment 时打开的 Column Reader、Index Read 占用的内存，在 Bvar 查看 `doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes`的变化，这个现象同样常见于读取大宽表，当打开几十万个 Column Reader 时，内存可能会占用几十GB。

如果你在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`ColumnReader` 字段，则基本可以确认是读取 Segment 时占用了大量内存。

此时只能通过修改 SQL 降低扫描的数据量，或者降低建表时指定的分桶大小，从而打开更少的 Segment。

## 5 依据 Heap Profile 定位内存

Heap Profile 支持实时查看进程内存使用，并可以看到调用栈，所以这通常需要对代码有一些了解，Doris 使用 Jemalloc 作为默认的 Allocator，有关 Jemalloc Heap Profile 的使用方法参考文档 [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)，需要注意的是 Heap Profile 记录的是虚拟内存。

如果在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`TabletSchema`、`ColumnReader` 字段，说明元数据占用内存大，参考本文 [元数据内存分析] 的章节。

如果集群运行一段时间后静置时 BE 内存不下降，此时在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，查看对应时间段的 BE 进程内存监控若呈现持续上升的趋势，那么有理由怀疑存在内存泄漏，依据调用栈对照代码继续分析。

如果集群上任务执行期间在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，任务结束后内存正常释放，说明大部分内存被正在运行的任务使用，不存在泄漏，如果此时 `Label=query, Type=overview` Memory Tracker 的值占总内存的比例，小于 Heap Profile 中包含上述字段的内存调用栈占总内存的比例，说明 `Label=query, Type=overview` Memory Tracker 统计的不准确，可以在社区及时反馈。
