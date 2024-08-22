---
{
    "title": "Memory Tracker",
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

Doris BE uses Memory Tracker to record process memory usage, including memory used in the life cycle of tasks such as query, import, compaction, schema change, and various caches. It supports real-time viewing of web pages and prints them to BE logs when memory-related errors are reported, which is used for memory analysis and troubleshooting of memory problems.

The viewing methods of Memory Tracker, the reasons for excessive memory usage represented by different Memory Trackers, and the analysis methods for reducing their memory usage have been introduced in [Overview](overview) in conjunction with the Doris BE memory structure. This article only introduces the principles, structure, and some common problems of Memory Tracker.

## Memory Tracking Principle

Memory Tracker relies on Doris Allocator to track each application and release of memory. For an introduction to Doris Allocator, refer to [Memory Control Strategy](./memory-control-strategy.md).

Process memory: Doris BE will periodically obtain Doris BE process memory from the system and is compatible with Cgroup.

Task memory: Each query, import, compaction and other tasks will create its own unique Memory Tracker when initialized, and put the Memory Tracker into TLS (Thread Local Storage) during execution. Doris's main memory data structures are inherited from Allocator. Allocator will record each application and release of memory in TLS's Memory Tracker.

Operator memory: Different execution operators of tasks will also create their own Memory Trakcer, such as Join/Agg/Sink, etc., which support manual memory tracking or put it into TLS and recorded by `Doris Allocator` for execution logic control and analysis of memory usage of different operators in Query Profile.

Global memory: Global memory mainly includes Cache and metadata, which are shared between different tasks. Each Cache has its own unique Memory Tracker, which is tracked by `Doris Allocator` or manually; metadata memory is not fully counted at present, and more analysis depends on various metadata Counters counted by Metrics and Bvar.

Among them, the Doris BE process memory is taken from the operating system and can be considered completely accurate. Due to implementation limitations, the memory tracked by other Memory Trackers is usually only a subset of the real memory, resulting in the sum of all Memory Trackers being less than the physical memory of the Doris BE process in most cases. There are certain omissions, but the memory recorded by Memory Tracker is more reliable in most cases and can be used for memory analysis with confidence. In addition, Memory Tracker actually tracks virtual memory, not the physical memory that is usually more concerned, and there are certain errors between them.

## Memory Tracker Structure

Based on the usage, Memory Tracker is divided into two categories. The first category, Memory Tracker Limiter, is unique in each query, import, Compaction and other tasks and global Cache, TabletMeta, and is used to observe and control memory usage; the second category, Memory Tracker, is mainly used to track memory hotspots during query execution, such as HashTable in Join/Aggregation/Sort/window functions, serialized intermediate data, etc., to analyze the memory usage of different operators in the query, and for memory control of imported data flushing.

The parent-child relationship between the two is only used for snapshot printing, and is associated with the label name, which is equivalent to a soft link. It does not rely on the parent-child relationship for simultaneous consumption, and the life cycle does not affect each other, reducing the cost of understanding and use. All memory trackers are stored in a set of maps, and provide methods such as printing snapshots of all memory tracker types, printing snapshots of tasks such as query/load/compaction, obtaining the group of queries/loads that currently use the most memory, and obtaining the group of queries/loads that currently use the most excessive memory.

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker Statistics Missing

The phenomenon of Memory Tracker Statistics Missing is different in versions before and after Doris 2.1.

### Memory Tracker Statistics Missing Phenomenon

1. There are two phenomena of Memory Tracker Statistics Missing after Doris 2.1.

- The difference between `Label=process resident memory` Memory Tracker and `Label=sum of all trackers` Memory Tracker is too large.

- The value of Orphan Memory Tracker is too large.

2. Before Doris 2.1, the value of Orphan Memory Tracker is too large, which means that the Memory Tracker statistics are missing.

### Analysis of missing Memory Tracker statistics

If the above phenomenon is observed, if the cluster is easy to restart and the phenomenon can be reproduced, refer to [Heap Profile Memory Analysis](heap-profile-memory-analysis.md) to use Jemalloc Heap Profile to analyze process memory.

Otherwise, you can refer to [Metadata Memory Analysis](./metadata-memory-analysis.md) to analyze the metadata memory of Doris BE.

> In versions prior to Doris 2.1.5, Segment Cache Memory Tacker is inaccurate. When you find that Memory Tracker statistics are missing or BE process memory does not decrease, you can refer to [Doris Cache Memory Analysis](./doris-cache-memory-analysis.md) to analyze SegmentCache memory usage and try to close Segment Cache before continuing the test. This is because the memory statistics of some indexes, including the Primary Key Index, are inaccurate, resulting in the Segment Cache memory not being effectively restricted, often occupying too much memory, especially on large wide tables with hundreds or thousands of columns. Refer to [Metadata Memory Analysis](./metadata-memory-analysis.md) If you find that `doris_be_cache_usage{name="SegmentCache"}` in Doris BE Metrics is not large, but `doris_column_reader_num` in Doris BE Bvar is large, you need to suspect the memory usage of Segment Cache. If you see `Segment` and `ColumnReader` fields in the call stack with a large memory usage in Heap Profile, it can be basically confirmed that Segment Cache occupies a large amount of memory.

### Reasons for missing Memory Tracker statistics

The following introduces the reasons for missing Memory Tracker statistics, which involve the implementation of Memory Tracker and usually do not need to be paid attention to.

#### Doris 2.1 and later

1. The difference between `Label=process resident memory` Memory Tracker and `Label=sum of all trackers` Memory Tracker is too large.

If the value of `Label=sum of all trackers` Memory Tracker accounts for more than 70% of `Label=process resident memory` Memory Tracker, it usually means that Memory Tracker has counted most of the memory of the Doris BE process, and usually only needs to analyze Memory Tracker to locate the memory location.

If the value of `Label=sum of all trackers` Memory Tracker accounts for less than 70% of `Label=process resident memory` Memory Tracker, it means that Memory Tracker statistics are missing, and Memory Tracker may not be able to accurately locate the memory location.

The difference between `Label=process resident memory` Memory Tracker and `Label=sum of all trackers` Memory Tracker is the memory not allocated by `Doris Allocator`. The main memory data structures of Doris are inherited from `Doris Allocator`, but there is still a part of memory not allocated by `Doris Allocator`, including metadata memory, RPC memory, etc., which may also be a memory leak. In this case, in addition to analyzing the Memory Tracker with a large memory value, it is usually necessary to pay attention to whether the metadata memory is reasonable and whether there is a memory leak.

2. Orphan Memory Tracker value is too large

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker is the default Memory Tracker. Positive or negative values ​​mean that the memory allocated by Doris Allocator is not accurately tracked. The larger the value, the lower the credibility of the overall statistical results of Memory Tracker. Its statistical value comes from two sources:

- If the Memory Tracker is not bound to TLS when the thread starts, Doris Allocator will record the memory to Orphan Memory Tracker by default, which means that this part of the memory is unknown. For the principle of Doris Allocator recording memory, please refer to the above [Memory Tracking Principle].

- If the value of the Memory Tracker of a task such as Query or Load is not equal to 0 when it is destroyed, it usually means that this part of the memory has not been released. The remaining memory will be recorded in the Orphan Memory Tracker, which is equivalent to letting the remaining memory continue to be tracked by the Orphan Memory Tracker. This ensures that the sum of the Orphan Memory Tracker and other Memory Trackers is equal to all the memory allocated by Doris Allocator.

Ideally, the value of the Orphan Memory Tracker is expected to be close to 0. So we hope that all threads will attach a Memory Tracker other than Orphan at the beginning, such as Query or Load Memory Tracker. And all Query or Load Memory Trackers are equal to 0 when they are destroyed, which means that the memory used during the execution of Query or Load has been released when it is destroyed.

If the Orphan Memory Tracker is not equal to 0 and has a large value, it means that a large amount of unknown memory has not been released, or a large amount of memory has not been released after the query and load are executed.

#### Before Doris 2.1

Before Doris 2.1, all unknown memory was counted in the `Label=Orphan` Memory Tracker, so a large value of the Orphan Memory Tracker means that the Memory Tracker statistics are missing.
