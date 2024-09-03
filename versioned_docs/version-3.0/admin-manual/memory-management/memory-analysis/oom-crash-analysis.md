---
{
    "title": "OOM Killer Crash Analysis",
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

If there is no error message in `log/be.out` after the BE process crashes, execute `dmesg -T`. If you see the following log, it means that the OOM Killer has been triggered. It can be seen that at `20240718 15:03:59`, the physical memory (anon-rss) of the doris_be process with pid 360303 is about 60 GB.

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

Ideally, Doris will regularly detect the remaining available memory of the operating system, and take a series of actions including blocking subsequent memory requests and triggering memory GC to avoid triggering OOM Killer when memory is insufficient. However, refreshing memory status and memory GC have a certain lag, and it is difficult to completely catch all large memory requests. When the cluster pressure is too high, there is still a certain probability of triggering OOM Killer, causing the BE process to crash. In addition, if the memory status of the process is abnormal, the memory GC cannot release the memory, resulting in a decrease in the actual available memory of the process, which will increase the memory pressure of the cluster.

If the OOM Killer is triggered, first analyze the memory status and task execution of the BE process before the OOM Killer is triggered based on the log, and then adjust the parameters in a targeted manner to restore the cluster to stability.

## Find the memory log before the OOM Killer is triggered

When the OOM Killer is triggered, it means that the process has insufficient available memory. Refer to [Memory Log Analysis](./memory-log-analysis.md) to find the last printed `Memory Tracker Summary` keyword from bottom to top at the time when the OOM Killer is triggered in `be/log/be.INFO` and analyze the main memory location of the BE process.

> `less be/log/be.INFO` After opening the file, first jump to the log corresponding to the time when OOM Killer was triggered. Taking the result of `dmesg -T` above as an example, enter `/20240718 15:03:59` and press Enter to search for the corresponding time. If it cannot be found, it may be that the time when OOM Killer was triggered is somewhat deviated. You can search for `/20240718 15:03:`. After the log jumps to the corresponding time, enter `/Memory Tracker Summary` and press Enter to search for keywords. By default, it will search downward in the log. If it cannot be found or the time does not match, you need to press `shift + n` to search upward first to find the last printed `Memory Tracker Summary` and the `Process Memory Summary` memory logs printed at the same time.

## Excessive cluster memory pressure triggers OOM Killer

If the following phenomenon is met, it can be considered that the cluster memory pressure is too high, resulting in the process memory status not being refreshed in time at a certain moment, and the memory GC failing to release the memory in time, resulting in the failure to effectively control the BE process memory.

> Before Doris 2.1, Memory GC was not perfect, and when the memory was constantly tight, it was often easier to trigger the OOM Killer.

- Analysis of `Memory Tracker Summary` found that the memory usage of queries and other tasks, various caches, metadata, etc. is reasonable.

- BE process memory monitoring in the corresponding time period shows that the memory usage rate is maintained at a high level for a long time, and there is no sign of memory leak

- Locate the memory log before the OOM Killer time point in `be/log/be.INFO`, search the `GC` keyword from bottom to top, and find that the BE process frequently executes memory GC.

At this time, refer to [BE Configuration Items](../../../admin-manual/config/be-config.md) to reduce `mem_limit` and increase `max_sys_mem_available_low_water_mark_bytes` in `be/conf/be.conf`. For more information about memory limits, watermark calculation methods, and memory GC, see [Memory Control Strategy](./../memory-feature/memory-control-strategy.md).

In addition, other parameters can be adjusted to control memory status refresh and GC, including `memory_gc_sleep_time_ms`, `soft_mem_limit_frac`, `memory_maintenance_sleep_time_ms`, `process_minor_gc_size`, `process_full_gc_size`, `enable_query_memory_overcommit`, `thread_wait_gc_max_milliseconds`, etc.

## Some abnormal problems trigger OOM Killer

If the cluster memory pressure is too high, the memory status may be abnormal at this time, and the memory GC may not be able to release the memory in time. The following are some common abnormal problems that trigger OOM Killer.

### Memory Tracker Statistics Missing

If the difference between `Label=process resident memory` Memory Tracker and `Label=sum of all trackers` Memory Tracker in the log `Memory Tracker Summary` is large, or the Orphan Memory Tracker value is too large, it means that there is a statistical missing in the Memory Tracker. Refer to the [Memory Tracker Statistics Missing] section in [Memory Tracker](./../memory-feature/memory-tracker.md) for further analysis.

### Query Cancel stuck

Locate the time point of OOM Killer in the `be/log/be.INFO` log, and then search `Memory Tracker Summary` in the context to find the process memory statistics log. If there is a query that uses a large amount of memory in the `Memory Tracker Summary`, execute `grep {queryID} be/log/be.INFO` to confirm whether there is a log with the keyword `Cancel`. The corresponding time point is the time when the query was canceled. If the query has been canceled, and the time point when the query was canceled is a long time away from the time point when the OOM Killer was triggered, refer to the analysis of [Query Cancel process stuck] in [Memory Problem FAQ](./memory-issue-faq.md). For analysis of `Memory Tracker Summary`, refer to [Memory Log Analysis](./memory-log-analysis.md).

### Jemalloc Metadata has a large memory footprint

Memory GC currently cannot release Jemalloc Metadata. Refer to the analysis of `Label=tc/jemalloc_metadata` Memory Tracker in [Memory Tracker](./../memory-feature/memory-tracker.md) to reduce memory usage.

### Jemalloc Cache has a large memory footprint

> Common in Doris 2.0

The default value of `lg_tcache_max` in `JEMALLOC_CONF` in `be.conf` of Doris 2.0 is 20, which will cause the Jemalloc Cache to be too large and unable to be automatically released in some scenarios. Refer to [Jemalloc Memory Analysis](./jemalloc-memory-analysis.md) to reduce the memory footprint of Jemalloc Cache.
