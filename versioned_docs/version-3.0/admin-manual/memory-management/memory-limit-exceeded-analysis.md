---
{
    "title": "Memory Limit Exceeded Analysis",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

When `MEM_LIMIT_EXCEEDED` appears in the error message of a query task, it means that the task is canceled because the process has insufficient available memory or the task exceeds the memory limit for a single execution.

```
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```

## Insufficient available memory for the process

If the error message contains `Process memory not enough`, it means that the process has insufficient available memory. Analysis steps:

1. Analyze the error message.

2. If the task itself has too much memory, try to reduce the task memory usage.

3. If the memory used by processes other than the task is too large, try to analyze the memory log, try to locate the memory location and consider reducing memory usage, and reserve more memory for query and other task execution.

### Parsing error messages

There are two situations when the process has insufficient available memory. One is that the current memory of the process exceeds the configured memory limit, and the other is that the remaining available memory of the system is lower than the water mark. There are three paths that will cancel tasks such as queries:

- If the error message contains `cancel top memory used`, it means that the task was canceled in the memory Full GC.
- If the error message contains `cancel top memory overcommit`, it means that the task was canceled in the memory Minor GC.
- If the error message contains `Allocator sys memory check failed`, it means that the task was canceled after failing to apply for memory from `Doris Allocator`.

For more information about memory limits, watermark calculation methods, and memory GC, see [Memory Management Features](./memory-management-feature)

#### 1 Canceled in memory Full GC

If the BE process memory exceeds the process memory upper limit (MemLimit) or the system's remaining available memory is lower than the memory low watermark (LowWaterMark), Full GC is triggered. At this time, the task with the largest memory will be canceled first.

```
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

Error message analysis:
1. `(10.16.10.8)`: BE node with insufficient memory during query.
2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: The currently canceled queryID, the query itself uses 866.97 MB of memory.
3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` The reason for the process memory exceeding the limit is that the physical memory used by the BE process, 3.12 GB, exceeds the MemLimit of 3.01 GB. The current operating system has 191.25 GB of memory available for BE to use, which is still higher than the LowWaterMark of 3.20 GB.

#### 2 Cancelled in Minor GC of memory

If the Doris BE process memory exceeds the process memory soft limit (SoftMemLimit) or the system's remaining available memory is lower than the memory warning watermark (WarningWaterMark), Minor GC is triggered. At this time, the query with the largest memory limit ratio will be canceled first.

``` ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO. ``` Error message analysis: 1. `process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` The reason for the process memory exceeding the limit is that the remaining memory available to BE in the current operating system is 3.25 GB, which is lower than the WarningWaterMark of 6.40 GB, and the physical memory used by the BE process is 2.12 GB, which does not exceed the SoftMemLimit of 2.71 GB.

#### 3 Failed to apply for memory from Allocator

Doris BE's large memory requests will be allocated through `Doris Allocator`, and the memory size will be checked during allocation. If the process has insufficient available memory, an exception will be thrown and an attempt will be made to Cancel the current query or import.

``` ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3b-b 4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB. ```` Error message analysis: 1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`: The queryID currently being canceled, the query currently uses 386704704 Bytes of memory, the query memory peak is 405956032 Bytes, and the operator being executed is `VAGGREGATION_NODE (id=7)>`.
2. `Cannot alloc:4294967296`: The current application for 4 GB of memory failed because the current process memory of 2.23 GB plus 4 GB will exceed the MemLimit of 3.01 GB.

### The task itself has too much memory

In the above analysis of the error information, if the memory used by the task itself accounts for a large proportion of the process memory, refer to [Memory Analyze Manual](./memory-analyze-manual) [Query Memory Analysis] to analyze the memory usage of the query, and try to adjust the parameters or optimize SQL to reduce the memory required for query execution.

It should be noted that if the task fails to apply for memory from the Allocator and is Canceled, `Cannot alloc` or `try alloc` shows that the memory currently being applied for by the Query is too large. At this time, you need to pay attention to whether the memory application here is reasonable. Search `Allocator sys memory check failed` in `be/log/be.INFO` to find the stack of memory application.

If the task itself uses very little memory, continue to refer to [Analyze memory logs, locate process memory locations and consider reducing memory usage] to try to reduce memory usage in other locations of the process, so as to reserve more memory for query and other task execution.

### Analyze memory logs, locate process memory locations and consider reducing memory usage

When a task is canceled due to insufficient available memory in the process, you can find the following log in `be/log/be.INFO` to confirm whether the current process memory usage is in line with expectations. The default interval for printing process memory limit logs is 1s. After the process memory exceeds the limit, most memory requests in BE will be sensed, and the predetermined callback method will be attempted, and the process memory limit log will be printed. The log is divided into two parts: `Process Memory Summary` and `Memory Tracker Summary`.

```
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

`Process Memory Summary` is the process memory status, refer to [Process Memory Status Log Analysis] in [Memory Analyze Manual](./memory-analyze-manual).

`Memory Tracker Summary` is a summary of the process Memory Tracker, including all Memory Trackers of `Type=overview` and `Type=global`, to help users analyze the current memory status. The `Used` of each Memory Tracker is the current memory size. Refer to [View Real-time Statistics] in [Memory Tracker](./memory-tracker.md) to analyze the meaning of each part of memory.

#### If the value of `Label=sum of all trackers` accounts for more than 70% of `Label=process resident memory`

It usually means that Memory Tracker has counted most of the memory of the Doris BE process. Usually, you only need to analyze the memory location of Memory Tracker and consider reducing its memory usage. Refer to [Memory Tracker](./memory-tracker.md) [Memory Tracker Memory Usage Excessive Analysis] to analyze the reasons for different Memory Trackers to occupy too much memory and how to reduce their memory usage.

In addition, you need to pay attention to the problem of Query Cancel stuck. Full GC will first cancel queries from large to small memory, and then cancel load from large to small memory. If a query is canceled in memory Full GC, but there are other queries in the BE process with memory larger than the currently canceled query, you need to pay attention to whether these queries with larger memory are stuck in the Cancel process. Usually, after executing `grep queryID be/log/be.INFO with larger memory usage`, check whether these queries with larger memory usage have triggered Cancel, and compare the Cancel time with the current Full GC time. If the interval is long (greater than 3s), these queries with larger memory usage stuck in the Cancel process cannot release memory, which will also cause insufficient memory for subsequent query execution.

#### If the value of `Label=sum of all trackers` accounts for less than 70% of `Label=process resident memory`

That is, the difference between `Label=process resident memory` and `Label=sum of all trackers` is large, indicating that Memory Tracker statistics are missing, and Memory Tracker may not be able to accurately locate the memory location. The difference is the memory that is not allocated by `Doris Allocator`. The main memory data structures of Doris are inherited from `Doris Allocator`, but there is still a part of memory that is not allocated by `Doris Allocator`, including metadata memory, RPC memory, etc., which may also be a memory leak. In this case, in addition to analyzing the Memory Tracker with a large memory value, it is usually necessary to pay attention to whether the metadata memory is reasonable and whether there is a memory leak.

If the cluster is easy to restart and the phenomenon can be reproduced, it is recommended to use Heap Profile directly to accurately locate the memory, which is also the most direct and effective method. Otherwise, you can refer to the [Metadata Memory Analysis] section in [Memory Analyze Manual](./memory-analyze-manual) to analyze the metadata memory of Doris BE.

> In versions before Doris 2.1.4, the problem of Segment Cache occupying large memory is more common. Usually, when it is found that the BE process memory does not decrease, you can first refer to the analysis of `Label=SegmentCache` Memory Trakcer in [Memory Tracker](./memory-tracker.md) to close Segment Cache and continue testing.

## Task exceeds the memory limit of a single execution

When `exceeded tracker` appears in the error message, it means that the task exceeds the memory limit of a single execution.

``` ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f7 8208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>> , can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

`show variables;` You can view Doris Session Veriable, where `exec_mem_limit` is the execution memory limit for a single query and import, but since Doris 1.2, query memory overcommit is supported, which is designed to allow queries to set more flexible memory limits. When there is sufficient memory, even if the query memory exceeds the upper limit, it will not be Cancel, so users usually do not need to pay attention to query memory usage. Until the memory is insufficient, the query will wait for a while when trying to allocate new memory. At this time, based on certain rules, the query with a larger ratio of `mem_used` to `exec_mem_limit` will be canceled first. If the size of the memory released during the waiting process meets the requirements, the query will continue to execute, otherwise an exception will be thrown and the query will be terminated.

If you want to turn off query memory overcommit, refer to [BE Configuration Items](../../admin-manual/config/be-config.md) and add `enable_query_memory_overcommit=false` in `conf/be.conf`. At this time, if the memory used by a single query or import exceeds `exec_mem_limit`, it will be canceled. If you want to avoid the negative impact of large queries on cluster stability, or want to accurately control the execution of tasks on the cluster to ensure sufficient stability, you can consider turning off query memory overcommit.

If you need to analyze the memory usage of queries, refer to [3.1 `Label=query, Type=overview` Query Memory Usage Excessive].

### Error information analysis
The error information is divided into three parts:
1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`: Query `f78208b15e064527-a84c5c0b04c04fcf` is currently being executed. When trying to apply for 1.03 MB of memory, it was found that the query exceeded the memory limit for a single execution. The query memory limit is 100 MB (`exec_mem_limit` in Session Variables). Currently, 99.25 MB has been used, and the peak memory is 99.29 MB.
2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`: The location of this memory application is `VHASH_JOIN_NODE (id=4)`, and it is prompted that the memory limit of a single query can be increased by `set exec_mem_limit`.

### Log analysis

After `set enable_profile=true`, when the task exceeds the memory limit of a single execution, more logs will be printed in `be/log/be.INFO` to confirm whether the current query memory usage meets expectations.

1. `Process Memory Summary`: Process memory statistics, refer to [2.1 Process Memory Summary].
2. `Memory Tracker Summary`: Memory Tracker statistics for the current query. You can see the current memory used and peak value of each operator in the query. For details, see [Memory Tracker](./memory-tracker.md).

```
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
