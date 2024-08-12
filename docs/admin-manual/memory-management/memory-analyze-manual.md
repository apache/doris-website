---
{
    "title": "Memory Analysis Handbook",
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

Doris BE process memory analysis mainly uses `be/log/be.INFO` log, BE process memory monitoring, and Doris Bvar statistics. If OOM Killer is triggered, you need to collect `dmesg -T` execution results. If you need to analyze query memory, you need to collect Query Profile. This article analyzes common memory problems based on this information. If you cannot solve the problem by yourself, you need to ask Doris developers for help. The channels are not limited to submitting issues on Github, creating issues on the Doris forum, contacting us by email or WeChat, and please provide us with the above information.

## 1 Process memory status log analysis

The Doris BE process memory will print the process memory status in the `log/be.INFO` log every time it increases or decreases by 256 MB. In addition, when the process memory is insufficient, the process memory status will also be printed along with other logs.

``` os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 1 35.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB. `` 1. `os physical memory 375.81 GB` refers to the system physical memory 375.81 GB.

2. `process memory used 4.09 GB (= 3.49 GB [vm/rss] - 410.44 MB [tc/jemalloc_cache] + 1 GB [reserved] + 0B [waiting_refresh])`
- Currently we think that the BE process uses 4.09 GB of memory, and the actual physical memory used by the BE process `vm/rss` is 3.49 GB,
- 410.44 MB of which is `tc/jemalloc_cache`. This part of the cache will be reused first in the subsequent execution process, so it is not counted as BE process memory here.
- `reserved` is the memory reserved during the execution process. Usually, before building HashTable and other operations that consume a lot of memory, the memory of HashTable is reserved in advance to ensure that the process of building HashTable will not be terminated due to insufficient memory. This part of the reserved memory is calculated in the BE process memory, even if it has not actually been allocated.
- `waiting_refresh` is the large memory requested in the interval between two memory status refreshes. The default interval for Doris memory status refreshes is 100ms. To avoid a large number of memory requests in the interval between two memory status refreshes, the memory GC is not detected and triggered in time after the memory exceeds the limit. Therefore, the large memory requested in the interval is calculated in the BE process memory. `waiting_refresh` will be cleared to 0 after each memory status refresh.

3. `sys available memory 134.41 GB (= 135.41 GB [proc/available] - 1 GB [reserved] - 0B [waiting_refresh])`
- The current remaining available memory for the BE process is 134.41 GB, and the actual memory `proc/available` available to the BE process in the system is 135.41 GB.
- 1GB of the memory has been reserved, so `reserved` is subtracted when calculating the remaining available memory of the BE process. Regarding `reserved` and `waiting_refresh` For an introduction to BE process memory, refer to the above annotations on BE process memory.

4. `limit 3.01 GB, soft limit 2.71 GB` and `low water mark 3.20 GB, warning water mark 6.40 GB`. For more information about MemLimit and WaterMark, see [Memory limit and watermark calculation method].

## 2 Analysis of BE process triggering OOM Killer

If there is no error message in `log/be.out` after the BE process crashes, execute `dmesg -T`. If you see the following log, it means that OOM Killer is triggered. It can be seen that at `20240718 15:03:59`, the physical memory (anon-rss) of the doris_be process is about 60 GB.

``` [Thu Jul 18 15:03:59 2024] oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=init.scope,mems_allowed=0,global_oom,task_memcg=/user.slice/user-0.slice/session-1093.scope,task=doris_be,pid=360303 ,uid=0 [Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

Ideally, Doris will regularly detect the remaining available memory of the operating system, and take a series of actions including blocking subsequent memory requests and triggering memory GC to avoid triggering OOM Killer when memory is insufficient. However, refreshing memory status and memory GC have a certain lag, and it is difficult to completely catch all large memory requests. When the cluster pressure is too high, there is still a certain probability of triggering OOM Killer, causing BE process Crash. In addition, if the process memory status is abnormal, memory GC cannot release memory, resulting in a reduction in the actual available memory of the process, which will increase the memory pressure of the cluster.

If OOM Killer is unfortunately triggered, first analyze the memory status and task execution of the BE process before triggering OOM Killer based on the log, and then adjust the parameters in a targeted manner to restore the cluster to stability.

### 2.1 Find the memory log before the OOM Killer is triggered

When the OOM Killer is triggered, it means that the process has insufficient available memory. Refer to the section [Analyze memory logs, locate process memory locations, and consider reducing memory usage] in [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis) to find the last printed `Memory Tracker Summary` keyword from bottom to top at the time when the OOM Killer is triggered in `be/log/be.INFO` and analyze it to find the main memory location of the BE process.

> After opening the file `less be/log/be.INFO`, first jump to the log corresponding to the time when the OOM Killer is triggered. Taking the result of `dmesg -T` above as an example, enter `/20240718 15:03:59` and press Enter to search for the corresponding time. If it cannot be found, it may be that the time when the OOM Killer is triggered is somewhat deviated. You can search for `/20240718 15:03:`. After the log jumps to the corresponding time, enter `/Memory Tracker Summary` and press Enter to search for keywords. By default, the search will go down in the log. If the search is not found or the time does not match, you need to press `shift + n` to search up first to find the last printed `Memory Tracker Summary` and the `Process Memory Summary` memory logs printed at the same time.

### 2.2 Excessive cluster memory pressure triggers OOM Killer

If the following phenomenon is met, it can be considered that the cluster memory pressure is too high, resulting in the process memory state not being refreshed in time at a certain moment, and the memory GC failing to release the memory in time, resulting in the failure to effectively control the BE process memory.
- Analysis of `Memory Tracker Summary` found that the memory usage of queries and other tasks, various caches, metadata, etc. is reasonable.
- BE process memory monitoring in the corresponding time period shows that the memory usage rate is maintained at a high level for a long time, and there is no sign of memory leak
- Locate the memory log before the OOM Killer time point in `be/log/be.INFO`, search the `GC` keyword from bottom to top, and find that the BE process frequently executes memory GC.

At this time, refer to [BE Configuration Items](../../admin-manual/config/be-config) to reduce `mem_limit` and increase `max_sys_mem_available_low_water_mark_bytes` in `be/conf/be.conf`. For more information about memory limits, watermark calculation methods, and memory GC, see [Memory Management Features](./memory-management-feature). In addition, you can adjust other parameters to control memory status refresh and GC, including `memory_gc_sleep_time_ms`, `soft_mem_limit_frac`, `memory_maintenance_sleep_time_ms`, `process_minor_gc_size`, `process_full_gc_size`, `enable_query_memory_overcommit`, `thread_wait_gc_max_milliseconds`, etc.

If the above phenomenon is not met, then it is considered that the memory state is abnormal at this time, and the memory GC may not be able to release the memory in time. The following are some common abnormal scenarios that trigger the OOM Killer.

### 2.2 Some abnormal scenarios trigger the OOM Killer

1. The difference between `Label=process resident memory` and `Label=sum of all trackers` is large

Refer to [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis) [If the value of `Label=sum of all trackers` accounts for less than 70% of `Label=process resident memory`] section for analysis.

2. Query Cancel is stuck (common before Doris 2.1.3)

Locate the memory log before the OOM Killer time point in `be/log/be.INFO`, and find the last printed keyword `tasks is being canceled and has not been completed yet` from bottom to top. This line of log indicates that there is a query being canceled but not completed. If the subsequent QueryID list is not empty, execute `grep queryID be/log/be.INFO` to confirm the start time of the query and the time when Cancel is triggered. If the time interval between the time when Cancel is triggered and the time when OOM Killer is triggered is long (greater than 3s), it means that the query cancel process is stuck. Further analyze the query execution log.

3. Jemalloc Metadata occupies a large amount of memory

Memory GC currently cannot release Jemalloc Metadata. Refer to the analysis of `Label=tc/jemalloc_metadata` Memory Tracker in [Memory Tracker](./memory-tracker.md) to reduce memory usage.

4. Jemalloc Cache occupies a large amount of memory (common in Doris 2.0)

The default value of `lg_tcache_max` in `JEMALLOC_CONF` in `be.conf` of Doris 2.0 is 20. In some scenarios, this will cause the Jemalloc Cache to be too large and unable to be automatically released. Refer to the analysis of `Label=tc/jemalloc_cache` Memory Tracker in [Memory Tracker](./memory-tracker.md) to reduce memory usage.

5. `Label=Orphan` Memory Tracker has large memory usage (only for Doris 2.0)

Before Doris 2.0, all unknown memory was counted in `Label=Orphan` Memory Tracker. The large memory usage of `Label=Orphan` Memory Tracker means that the Memory Tracker statistics are missing. The analysis method is the same as the analysis of [the difference between `Label=process resident memory` minus `Label=sum of all trackers` is large] after Doris 2.1 mentioned above.

## 3 Query memory analysis

Usually, query profile is used to analyze query memory usage first. If the sum of the memory of each operator (Operator) counted in the query profile is much smaller than the memory counted by the query memory Trcker, it means that the operator memory counted by the query profile is much different from the actual memory used, so it is often necessary to use the heap profile for further analysis. If a query is canceled due to memory limit excess and cannot be completed, the query profile is incomplete and may not be analyzed accurately. Usually, the Heap Profile is used directly to analyze the query memory usage.

### 3.1 Use Query Profile to analyze query memory usage

1. Locate Operators or memory data structures that use a lot of memory

Find query information including SQL in `fe/log/fe.audit.log` based on QueryID, get the query plan by `explain SQL`, and get the query profile of the query by executing SQL after `set enable_profile=true`. For a detailed introduction to Query Profile, refer to the document [Query Profile](../../query/query-analysis/query-profile.md). Here we only introduce the memory-related content in Query Profile, and locate Operators and data structures that use a lot of memory based on it.

Query Profile is divided into two parts:

- `MergedProfile`

MergedProfile is the aggregated result of all Instance Profiles of Query, which shows the sum, avg, max, and min of memory usage of each Operator in each Pipeline of each Fragment on all Instances, including the Operator's peak memory `PeakMemoryUsage` and the peak memory of major memory data structures such as `HashTable` and `Arena`, so as to locate the Operators and data structures that use a lot of memory.

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

- `Execution Profile`

`Execution Profile` is the result of each Instance Profile of the Query. Usually, after locating the Operator and data structure that use a lot of memory based on `MergedProfile`, you can analyze the reasons for their memory usage based on the query plan after `explain SQL`. If you need to analyze the memory value of a Query in a certain BE node or a certain Instance in some scenarios, you can further locate it based on `Execution Profile`.

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

2. `HASH_JOIN_SINK_OPERATOR` takes up too much memory

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

It can be seen that the `BuildBlocks` and `HashTable` in the Hash Join Build phase mainly use memory. Usually, the Hash Join Build phase uses too much memory. First, confirm whether the Join Reorder order is reasonable. Usually, the correct order is to use small tables for Hash Join Build and large tables for Hash Join Probe. This can minimize the overall memory usage of Hash Join and usually has better performance.

In order to confirm whether the Join Reorder order is reasonable, we find the profile of `HASH_JOIN_OPERATOR` with id=12. We can see that `ProbeRows` has only 196240 rows. Therefore, the correct order of this Hash Join Reorder should be to swap the positions of the left and right tables. You can `set disable_join_reorder=true` to turn off Join Reorder and manually specify the order of the left and right tables and then perform Query verification. For further information, please refer to the relevant documents on Join Reorder in the query optimizer.

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

### 3.2 Use Heap Profile to Analyze Query Memory Usage

If the Query Profile above cannot accurately locate the memory usage, you can use Jemalloc or TCMalloc's Heap Profile to analyze the query's memory usage.

Doris uses Jemalloc as the default Allocator. For information about how to use Jemalloc Heap Profile, refer to the document [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1).

Dump the Heap Profile once before the query is executed, and dump the Heap Profile again during the query execution. By using `jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2` to compare the memory changes between the two Heap Profiles, you can get the memory usage ratio of each function in the code during the query execution. By comparing the code, you can locate the memory usage location. Because the memory changes in real time during the query execution, you may need to dump the Heap Profile multiple times during the query execution and compare and analyze.

## 4 Metadata memory analysis

The metadata of Doris BE in memory includes data structures such as `Tablet`, `Rowset`, `Segment`, `TabletSchema`, `ColumnReader`, `PrimaryKeyIndex`, and `BloomFilterIndex`. For more information about Doris BE metadata, refer to the document [Analysis of Doris Storage Structure Design](https://blog.csdn.net/ucanuup_/article/details/115004829).

Currently, there is no accurate statistics on the metadata memory size of Doris BE, so it cannot be seen in Memory Tracker. You can estimate the metadata memory size by looking at some Counters in `Bvar` and `metrics`. Or when using Heap Profile analysis, if you see `Segment`, `TabletSchema`, and `ColumnReader` fields in the call stack with a large memory share, it means that the metadata occupies a large amount of memory.

`Bvar` can be viewed at `{be_host}:{be_brpc_port}/vars`. Related metrics are introduced below.

- `doris_total_tablet_num`: the number of all tablets.
- `doris_total_rowset_num`: the number of all rowsets.
- `doris_total_segment_num`: the number of all open segments.
- `doris_total_tablet_schema_num`: the number of all tablet schemas.
- `tablet_schema_cache_count`: the number of cached tablet schemas.
- `tablet_meta_schema_columns_count`: the number of columns in all tablet schemas.
- `tablet_schema_cache_columns_count`: the number of cached columns in a tablet schema.
- `doris_column_reader_num`: the number of open column readers.
- `doris_column_reader_memory_bytes`: the number of bytes occupied by the opened Column Reader.
- `doris_ordinal_index_memory_bytes`: the number of bytes occupied by the opened Ordinal Index.
- `doris_zone_map_memory_bytes`: the number of bytes occupied by the opened ZoneMap Index.
- `doris_short_key_index_memory_bytes`: the number of bytes occupied by the opened Short Key Index.
- `doris_pk/index_reader_bytes`: the cumulative number of bytes occupied by the Primary Key Index Reader. This is not a real-time statistical value and is expected to be fixed.
- `doris_pk/index_reader_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_cached_pages`: Same as above, the cumulative value of the statistics.
- `doris_pk/index_reader_pagindex_reader_pk_pageses`: Same as above, cumulative value of statistics.
- `doris_primary_key_index_memory_bytes`: Same as above, cumulative value of statistics.

`metrics` View method: `{be_host}:{be_web_server_port}/metrics`, including cache statistics.

- `doris_be_cache_usage{name="TabletSchemaCache"}`: Number of elements cached by Tablet Schema Cache.
- `doris_be_cache_usage{name="SegmentCache"}`: Number of elements cached by Segment Cache.
- `doris_be_cache_usage{name="SchemaCache"}`: Number of elements cached by Schema Cache.

The following lists several common phenomena and reasons for excessive metadata memory.

### 4.1 The process memory is too large right after the BE process is started

This is usually because the metadata memory loaded when the BE process is started is too large. Check `Bvar`.

- If `doris_total_tablet_num` is too much, it is usually because the number of partitions and buckets of the table is too large. Check `{fe_host}:{fe_http_port}/System?path=//dbs` to find tables with a large number of tablets. The number of tablets of a table is equal to the number of its partitions multiplied by the number of buckets. Try to reduce the number of its partitions and buckets. Or delete outdated tables or partitions that will not be used.
- If `doris_total_rowset_num` is too much, but the number of tablets is not large, refer to the `SHOW-PROC` document to find tables with many rowsets but not many tablets, and then manually trigger compaction, or wait for automatic compaction to complete. For details, refer to the metadata management related documents. It is normal for metadata to occupy several GB when there are hundreds of thousands of rowsets.
- If `tablet_meta_schema_columns_count` is too large, hundreds or thousands of times larger than `doris_total_tablet_schema_num`, it means that there are large wide tables with hundreds or thousands of columns in the cluster. In this case, the same number of tablets will occupy more memory.
- If you see `Tablet` and `TabletSchema` fields in the call stack with a large memory usage in the Heap Profile, it can be basically confirmed that the metadata occupies a large amount of memory.

### 4.2 BE process memory does not decrease after the cluster runs for a period of time

When the BE process memory does not decrease and the Memory Tracker statistics are missing and the memory cannot be located, you can first check the memory occupied by the metadata cache.

The common metadata cache that occupies a large amount of memory is Segment Cache. We analyzed the `Label=SegmentCache` Memory Tracker above, but the memory statistics of some Indexes including Primary Key Index are inaccurate, resulting in inaccurate Memory Tracker. Especially on large and wide tables with hundreds or thousands of columns, if you find that `doris_be_cache_usage{name="SegmentCache"}` is not large, but `doris_column_reader_num` is large, you need to be more suspicious of the memory usage of Segment Cache.

If you see the `Segment` and `ColumnReader` fields in the call stack with a large memory usage in the Heap Profile, it can be basically confirmed that Segment Cache occupies a large amount of memory.

Refer to [BE Configuration Items](../../admin-manual/config/be-config.md), add `disable_segment_cache=true` in `conf/be.conf` to disable `SegmentCache` and restart the BE process. You can refer to [3.5.2. `Label=SegmentCache` uses too much memory] to adjust the use of `SegmentCache`.

### 4.3. Query does not have complex operators but simply scans data, but it uses a lot of memory

It may be the memory occupied by the Column Reader and Index Read opened when reading the Segment. Check the changes of `doris_total_segment_num`, `doris_column_reader_num`, `doris_ordinal_index_memory_bytes`, `doris_zone_map_memory_bytes`, and `doris_short_key_index_memory_bytes` in Bvar. This phenomenon is also common when reading large wide tables. When hundreds of thousands of Column Readers are opened, the memory may occupy tens of GB.

If you see the `Segment` and `ColumnReader` fields in the call stack with a large memory usage in the Heap Profile, it can be basically confirmed that a large amount of memory is occupied when reading the Segment.

At this time, you can only modify the SQL to reduce the amount of data scanned, or reduce the bucket size specified when creating the table, so as to open fewer segments.

## 5 Locate memory based on Heap Profile

Heap Profile supports real-time viewing of process memory usage and call stacks, so this usually requires some understanding of the code. Doris uses Jemalloc as the default Allocator. For information about how to use Jemalloc Heap Profile, refer to the document [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1). It should be noted that Heap Profile records virtual memory.

If you see `Segment`, `TabletSchema`, and `ColumnReader` fields in the call stack with a large memory share in Heap Profile, it means that metadata occupies a large amount of memory. Refer to the section [Metadata Memory Analysis] in this article.

If the BE memory does not decrease when the cluster is idle after running for a period of time, then you can see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile. If the BE process memory monitoring in the corresponding time period shows a continuous upward trend, then there is reason to suspect that there is a memory leak. Continue to analyze the code based on the call stack.

If you see fields such as `Agg`, `Join`, `Filter`, `Sort`, and `Scan` in the call stack with a large memory share in the Heap Profile during task execution on the cluster, and the memory is released normally after the task is completed, it means that most of the memory is used by the running tasks and there is no leak. If the value of `Label=query, Type=overview` Memory Tracker accounts for a smaller proportion of the total memory than the memory call stack containing the above fields in the Heap Profile, it means that the statistics of `Label=query, Type=overview` Memory Tracker are inaccurate, and you can provide timely feedback in the community.
