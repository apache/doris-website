---
{
    "title": "Memory Issue FAQ",
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

Doris BE process memory analysis mainly uses `be/log/be.INFO` log, BE process memory monitoring (Metrics), Doris Bvar statistics. If OOM Killer is triggered, you need to collect `dmesg -T` execution results. If you analyze the memory of query or import tasks, you need to collect Query Profile. Analyze common memory problems based on this information. If you cannot solve the problem by yourself, you need to ask Doris developers for help. No matter which way you use (submit issue on Github, create issue on Doris forum, email or WeChat), please add the above information to your problem description.

First locate which memory problem the currently observed phenomenon belongs to, and further investigate. Usually, you need to analyze the process memory log first. Refer to [Memory Log Analysis](./memory-log-analysis.md). Common memory problems are listed below.

## 1 Query and import memory limit error

When `MEM_LIMIT_EXCEEDED` appears in the query and import error message, it means that the task is canceled because the process has insufficient available memory or the task exceeds the memory limit for a single execution.

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```

If the error message contains `Process memory not enough`, it means that the process has insufficient available memory. Refer to [Query or import error process has insufficient available memory](./query-cancelled-after-process-memory-exceeded.md) for further analysis.

If `memory tracker limit exceeded` appears in the error message, it means that the task exceeds the single execution memory limit. Refer to [Query or import error exceeds single execution memory limit](./query-cancelled-after-query-memory-exceeded.md) for further analysis.

## 2 Doris BE OOM Crash

If there is no error message in `log/be.out` after the BE process crashes, execute `dmesg -T`. If you see `Out of memory: Killed process {pid} (doris_be)`, it means that the OOM Killer is triggered. Refer to [OOM Killer Crash Analysis](./oom-crash-analysis.md) for further analysis.

## 3 Memory Leak

If the following phenomenon is observed, it means that there may be a memory leak:

- Doris Grafana or server monitoring finds that the memory of the Doris BE process has been growing linearly, and the memory does not decrease after the task on the cluster stops.

- Memory Tracker has missing statistics, refer to [Memory Tracker](./memory-tracker.md) for analysis.

Memory leaks are usually accompanied by missing statistics in Memory Tracker, so the analysis method also refers to the [Memory Tracker] section.

## 4 Doris BE process memory does not decrease or continues to increase

If Doris Grafana or server monitoring finds that the memory of the Doris BE process has been increasing linearly, and the memory does not decrease after the task on the cluster is stopped, first refer to [Memory Tracker](./memory-tracker.md) in [Memory Tracker](./memory-tracker.md) to analyze whether there is missing statistics in Memory Tracker. If there is missing statistics in Memory Tracker, further analyze the cause.

If Memory Tracker does not have missing statistics and has counted most of the memory, refer to [Overview](./overview.md) to analyze the reasons why different parts of the Doris BE process occupy too much memory and how to reduce its memory usage.

## 5 Large virtual memory usage

`Label=process virtual memory` Memory Tracker displays the real-time virtual memory size, which is the same as the virtual memory of the Doris BE process seen by `top -p {pid}`.

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```

Doris currently still has the problem of Doris BE process virtual memory being too large, usually because Jemalloc retains a large number of virtual memory mappings, which will also cause Jemalloc Metadata to occupy too much memory. Refer to [Jemalloc Memory Analysis](./jemalloc-memory-analysis.md) for the analysis of Jemalloc Metadata memory.

In addition, it is known that Doris's Join Operator and Column lack memory reuse, which will cause more virtual memory to be requested in some scenarios and eventually cached in Jemalloc Retained. There is currently no good solution. It is recommended to restart the Doris BE process regularly.

## 6 The process memory is very large after the BE process is just started

This is usually because the metadata memory loaded when the BE process starts is too large. Refer to [Metadata Memory Analysis](./metadata-memory-analysis.md) to view Doris BE Bvar.

- If `doris_total_tablet_num` is too much, it is usually because the number of partitions and buckets of the table is too large. Check `{fe_host}:{fe_http_port}/System?path=//dbs` to find a table with a large number of tablets. The number of tablets of a table is equal to the number of its partitions multiplied by the number of buckets. Try to reduce the number of its partitions and buckets. Or delete outdated tables or partitions that will not be used.

- If `doris_total_rowset_num` is too large but the number of tablets is small, refer to the `SHOW-PROC` document to find tables with many rowsets but few tablets, and then manually trigger compaction, or wait for automatic compaction to complete. For details, refer to the metadata management related documents. It is normal for metadata to occupy several GB when there are hundreds of thousands of rowsets.

- If `tablet_meta_schema_columns_count` is too large, hundreds or thousands of times larger than `doris_total_tablet_schema_num`, it means that there are large wide tables with hundreds or thousands of columns in the cluster. At this time, the same number of tablets will occupy more memory.

### 7 Query does not have complex operators but simply scans data, but it uses a lot of memory

It may be the memory occupied by the Column Reader and Index Read opened when reading the Segment. Refer to [Metadata Memory Analysis](./metadata-memory-analysis.md) to view the changes of `doris_total_segment_num`, `doris_column_reader_num`, `doris_ordinal_index_memory_bytes`, `doris_zone_map_memory_bytes`, and `doris_short_key_index_memory_bytes` in Doris BE Bvar. This phenomenon is also common when reading large wide tables. When hundreds of thousands of Column Readers are opened, the memory may occupy tens of GB.

If you see the `Segment` and `ColumnReader` fields in the call stack with a large memory share in the Heap Profile, it can be basically confirmed that a large amount of memory is occupied when reading the Segment.

At this time, you can only modify the SQL to reduce the amount of data scanned, or reduce the bucket size specified when creating the table, so as to open fewer segments.
