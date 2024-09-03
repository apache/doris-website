---
{
    "title": "Query error Process Memory Not Enough",
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

When `MEM_LIMIT_EXCEEDED` appears in the error message of the query and contains `Process memory not enough`, it means that the process is canceled due to insufficient available memory.

First, parse the error message to confirm the reason for Cancel, the memory size used by the query itself when Canceled, and the memory status of the process. There are usually three reasons for the Cancel of the query:

1. The memory of the Canceled Query itself is too large.

2. The memory of the Canceled Query itself is small, and there are other queries with larger memory.

3. The memory of the globally shared Cahce, metadata, etc. is too large, or the memory of other tasks other than query and load tasks is too large

## Error message analysis

There are two situations when the available memory of the process is insufficient. One is that the current memory of the process exceeds the configured memory limit, and the other is that the remaining available memory of the system is lower than the watermark. There are three paths to cancel tasks such as queries:

- If the error message contains `cancel top memory used`, it means that the task is canceled in the memory Full GC.

- If the error message contains `cancel top memory overcommit`, it means that the task was canceled in the memory Minor GC.

- If the error message contains `Allocator sys memory check failed`, it means that the task was canceled after failing to apply for memory from `Doris Allocator`.

After analyzing the error message below,

- If the memory used by the query and load itself accounts for a large proportion of the process memory, refer to [Query own memory is too large] to analyze the memory usage of the query and load, and try to adjust parameters or optimize SQL to reduce the memory required for execution.

- If the task itself uses very little memory, refer to [Process memory other than query and load is too large] to try to reduce the memory usage of other locations in the process, so as to reserve more memory for query and other task execution.

For more information about memory limits, watermark calculation methods, and memory GC, see [Memory Control Strategy](./../memory-feature/memory-control-strategy.md)

### 1 Canceled in memory Full GC

If the BE process memory exceeds the process memory upper limit (MemLimit) or the system's remaining available memory is lower than the memory low watermark (LowWaterMark), Full GC is triggered. At this time, the task with the largest memory will be canceled first.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

Error message analysis:

1. `(10.16.10.8)`: BE node with insufficient memory during query.

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: The currently canceled queryID, the query itself uses 866.97 MB of memory.

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` The reason for the process memory exceeding the limit is that the physical memory used by the BE process, 3.12 GB, exceeds the MemLimit of 3.01 GB. The current operating system has 191.25 GB of memory available for BE to use, which is still higher than the LowWaterMark of 3.20 GB.

### 2 Canceled in Minor GC of memory

If the Doris BE process memory exceeds the process memory soft limit (SoftMemLimit) or the system's remaining available memory is lower than the memory warning watermark (WarningWaterMark), Minor GC is triggered. At this time, the query with the largest memory limit ratio will be canceled first.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```

Error message analysis: `process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` The reason for the process memory exceeding the limit is that the remaining memory available to BE in the current operating system is 3.25 GB, which is lower than the WarningWaterMark of 6.40 GB, and the physical memory used by the BE process is 2.12 GB, which does not exceed the SoftMemLimit of 2.71 GB.

### 3 Failed to apply for memory from Allocator

Doris BE's large memory requests will be allocated through `Doris Allocator`, and the memory size will be checked during allocation. If the process has insufficient available memory, an exception will be thrown and the current query will be attempted to be canceled.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```

Error message analysis:

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`: The queryID currently being canceled, the query currently uses 386704704 Bytes of memory, the query memory peak is 405956032 Bytes, and the operator being executed is `VAGGREGATION_NODE (id=7)>`.

2. `Cannot alloc:4294967296`: The current application for 4 GB of memory failed because the current process memory of 2.23 GB plus 4 GB will exceed the MemLimit of 3.01 GB.

## The memory usage of the Canceled Query is too large

Refer to [Query Memory Analysis](./query-memory-analysis.md) or [Load Memory Analysis](./load-memory-analysis.md) to analyze the memory usage of queries and loads, and try to adjust parameters or optimize SQL to reduce the memory required for execution.

It should be noted that if the task fails to apply for memory from the Allocator and is Canceled, `Cannot alloc` or `try alloc` will show that the memory currently being applied for by the Query is too large. At this time, you need to pay attention to whether the memory application here is reasonable. Search `Allocator sys memory check failed` in `be/log/be.INFO` to find the stack of memory application.

## The Canceled Query itself has a small memory, and there are other queries with larger memory

Usually, it is because the query with larger memory is stuck in the Cancel stage and cannot release the memory in time. Full GC will first cancel queries in order of memory usage, and then cancel loads in order of memory usage. If a query is canceled in memory Full GC, but there are other queries in the BE process that use more memory than the currently canceled query, you need to pay attention to whether these queries with larger memory usage are stuck during the cancel process.

First, execute `grep {queryID} be/log/be.INFO` to find the time when the query is canceled, and then search `Memory Tracker Summary` in the context to find the process memory statistics log. If there is a query that uses more memory in `Memory Tracker Summary`. Run `grep {queryID with larger memory} be/log/be.INFO` to check if there is a log with the keyword `Cancel`. The corresponding time point is the time when the query is canceled. If the query is also canceled, and the time point when the query with larger memory is canceled is different from the time point when the current query is canceled, refer to [Query Cancel process stuck] in [Memory Issue FAQ](./memory-issue-faq.md) to analyze whether the query with larger memory is stuck in the cache process. For the analysis of `Memory Tracker Summary`, refer to [Memory Log Analysis](./memory-log-analysis.md).

## Process memory outside query and load tasks is too large

Try to locate the memory location and consider reducing memory usage to reserve more memory for query and load execution.

The time when the task was canceled due to insufficient available memory can be found in the process memory statistics log in `be/log/be.INFO`. Run `grep queryID be/log/be.INFO` to find the time when the query was canceled, and then search `Memory Tracker Summary` in the context to find the process memory statistics log. Then refer to the [Process Memory Statistics Log Analysis] section in [Memory Log Analysis](./memory-log-analysis.md) for further analysis. Before analysis, refer to the [Memory Tracker Statistics Missing] section in [Memory Tracker](./../memory-feature/memory-tracker.md) to analyze whether the Memory Tracker has statistics missing.

If the Memory Tracker has statistics missing, refer to the [Memory Tracker Statistics Missing] section for further analysis. Otherwise, Memory Tracker counts most of the memory and there is no missing statistics. Refer to [Overview](./../overview.md) to analyze the reasons why different parts of the Doris BE process occupy too much memory and how to reduce its memory usage.
