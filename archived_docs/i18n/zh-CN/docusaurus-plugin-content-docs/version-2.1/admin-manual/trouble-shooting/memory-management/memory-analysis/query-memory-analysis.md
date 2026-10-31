---
{
    "title": "查询内存分析",
    "language": "zh-CN",
    "description": "通常先使用 Query Profile 分析查询内存使用，如果 Query Profile 中统计的各个算子（Operator）内存之和远小于 Query Memory Trcker 统计到的内存，说明 Query Profile 统计到的算子内存与实际使用的内存相差较大，"
}
---

通常先使用 Query Profile 分析查询内存使用，如果 Query Profile 中统计的各个算子（Operator）内存之和远小于 Query Memory Trcker 统计到的内存，说明 Query Profile 统计到的算子内存与实际使用的内存相差较大，那么往往还需要使用 Heap Profile 进一步分析。如果 Query 因为内存超限被 Cancel，无法执行完成，此时 Query Profile 不完整，可能无法准确分析，通常直接使用 Heap Profile 分析 Query 内存使用。

## 查询内存查看

如果任何地方看到 `Label=query, Type=overview` Memory Tracker 的值较大，说明查询内存使用多。

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

如果你已知要分析的查询，那么跳过本节继续后面的分析，否则可以参考下面的方法定位大内存查询。

首先定位大内存查询的 QueryID，在 BE web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` 中按照 `Current Consumption` 排序可以看到实时的大内存查询，在 `label` 中可以找到 QueryID。

当报错进程内存超限或可用内存不足时，在 `be.INFO` 日志中 `Memory Tracker Summary` 下半部分包含内存使用 TOP 10 的任务（查询/导入/Compaction 等）的 Memory Tracker，格式为 `MemTrackerLimiter Label=Query#Id=xxx, Type=query`，通常在 TOP 10 的任务中就能定位到大内存查询的 QueryID。

历史查询的内存统计结果可以查看`fe/log/fe.audit.log`中每个查询的`peakMemoryBytes`，或者在`be/log/be.INFO`中搜索`Deregister query/load memory tracker, queryId`查看单个 BE 上每个查询的内存峰值。

## 使用 Query Profile 分析查询内存使用

依据 QueryID 在 `fe/log/fe.audit.log` 中找到包括 SQL 在内的查询信息，`explain SQL` 得到查询计划，`set enable_profile=true`后执行 SQL 得到查询的 Query Profile，有关 Query Profile 的详细介绍参考文档 [Query Profile](../../../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)，这里只介绍 Query Profile 中内存相关的内容，并据此定位使用大量内存的 Operator 和数据结构。

1. 定位使用大量内存的 Operator 或内存数据结构

Query Profile 分为两部分：

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

## 使用 Heap Profile 分析查询内存使用

如果上面使用 Query Profile 无法准确定位内存的使用位置，若集群方便重启，并且现象可以被复现，参考 [Heap Profile 内存分析](./heap-profile-memory-analysis.md) 分析 Query 内存。

在 Query 执行前 Dump 一次 Heap Profile，在 Query 执行过程中再 Dump 一次 Heap Profile，通过使用 `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2` 对比两个 Heap Profile 之间的内存变化，可以得出代码中的每个函数在 Query 执行过程中使用的内存占比，对照代码即可定位内存使用位置，因为 Query 执行过程中内存实时变化，所以可能需要在 Query 执行过程中多次 Dump Heap Profile 并对比分析。
