---
{
    "title": "Memory Tracker",
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

The Memory Tracker records the memory usage of the Doris BE process, including the memory used in the life cycle of tasks such as query, import, compaction, schema change, and various caches, which are used to analyze the memory hotspots of processes and queries in real time.

## Principle

Process memory: Doris BE will periodically obtain the Doris BE process memory from the system and is compatible with Cgroup.

Task memory: Each query, import, compaction and other tasks will create its own unique Memory Tracker when initialized, and put the Memory Tracker into TLS (Thread Local Storage) during execution. The main memory data structure of Doris is inherited from Allocator. Allocator will record each application and release of memory in TLS's Memory Tracker.

Operator memory: Different execution operators of tasks will also create their own Memory Trakcer, such as Join/Agg/Sink, etc., which supports manual memory tracking or putting it into TLS and recorded by `Doris Allocator` for execution logic control and analysis of memory usage of different operators in Query Profile.

Global memory: Global memory mainly includes Cache and metadata shared between different tasks. Each Cache has its own unique Memory Tracker, which is tracked by `Doris Allocator` or manually; metadata memory is not fully counted at present, and more analysis depends on various metadata Counters counted by Metrics and Bvar.

Among them, process memory can be considered completely accurate because it is taken from the system. The memory recorded by other Memory Trackers has a certain error from the real memory due to implementation limitations. In addition, Memory Tracker records virtual memory instead of physical memory, which is usually more concerned. This also affects the credibility of Memory Tracker. However, in most cases, the difference between Doris virtual memory and physical memory is very small, so there is no need to pay attention. For the analysis of Memory Tracker error xxx, see xxx

## View real-time statistical results

Real-time memory statistics can be viewed through the Doris BE Web page `http://{be_host}:{be_web_server_port}/mem_tracker` (webserver_port defaults to 8040).

### Home page `http://{be_host}:{be_web_server_port}/mem_tracker`
![image](https://github.com/apache/doris/assets/13197424/f989f4d2-4cc5-4a8e-880e-93ae6073d17d)
Show the Memory Tracker of `type=overview`, including Query/Load/Compaction/Global and other parts, showing their current memory usage and peak memory respectively.

1. Label: Name of Memory Tracker
- process resident memory: process physical memory, Current Consumption is taken from VmRSS in `/proc/self/status`, Peak Consumption is taken from VmHWM in `/proc/self/status`.
- process virtual memory: process virtual memory, Current Consumption is taken from VmSize in `/proc/self/status`, Peak Consumption is taken from VmPeak in `/proc/self/status`.
- sum of all trackers: includes all virtual memory allocated from `Doris Allocator`, as well as Cache and Metadata of general memory allocators TCMalloc or Jemalloc, and some memory manually tracked without using `Doris Allocator`. That is, except for `process resident memory` and `process virtual memory`, the sum of Current Consumption of other `type=overview` Memory Trackers.
- global: the sum of all global memory allocated from `Doris Allocator`, including Cache, metadata, decompression, etc., which have the same life cycle as the process.
- tc/jemalloc_cache: cache of general memory allocator TCMalloc or Jemalloc. Doris uses Jemalloc by default. The memory occupied by Jemalloc itself includes three parts: Thread Cache, Dirty Page, and Metadata. The Jemalloc cache includes Dirty Page and Thread Cache. The original profile of the memory allocator can be viewed in real time at http://{be_host}:{be_web_server_port}/memz.
- tc/jemalloc_metadata: Metadata of the general memory allocator TCMalloc or Jemalloc. The original profile of the memory allocator can be viewed in real time at http://{be_host}:{be_web_server_port}/memz.
- reserved_memory: reserved memory. Before querying behaviors that require large memory such as building a Hash Table, the memory of the size of the built Hash Table will be reserved from the Memory Tracker to ensure that subsequent memory requests can be met.
- query: The sum of memory allocated from `Doris Allocator` by all queries, that is, the sum of Current Consumption of all Query Memory Trackers.
- load: The sum of memory allocated from `Doris Allocator` by all imports, that is, the sum of Current Consumption of all Load Memory Trackers.
- compaction: The sum of memory allocated from `Doris Allocator` by all Compaction tasks, that is, the sum of Current Consumption of all Compaction Memory Trackers.
- schema_change: The sum of memory allocated from `Doris Allocator` by all Schema Change tasks, that is, the sum of Current Consumption of all Schema Change Memory Trackers.
- other: The sum of memory allocated from `Doris Allocator` by other tasks except the above, such as EngineAlterTabletTask, EngineCloneTask, CloudEngineCalcDeleteBitmapTask, SnapshotManager, etc.

2. Current Consumption(Bytes): Current memory value, in B.
3. Current Consumption (Normalize): .G.M.K formatted output of the current memory value.
4. Peak Consumption (Bytes): The peak memory value after the BE process is started, in bytes, and reset after BE is restarted.
5. Peak Consumption (Normalize): .G.M.K formatted output of the peak memory value after the BE process is started, and reset after BE is restarted.

In the Memory Tracker of `type=overview`, except for `process resident memory`, `process virtual memory`, and `sum of all trackers`, other trackers can use Lable `/mem_tracker?type=Lable` to view details.

### Global Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=global`
![image](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)
Shows the Memory Tracker of `type=global`.

Parent Label: Used to indicate the parent-child relationship between two Memory Trackers. The memory recorded by the Child Tracker is a subset of the Parent Tracker. The memory recorded by different Trackers with the same Parent may have an intersection.

- Orphan: Collects unowned memory. Ideally, it is expected to be equal to 0. Current Consumption is positive or negative, which means that the memory allocated by `Doris Allocator` is not accurately tracked. The larger the Consumption, the lower the credibility of the Memory Tracker statistics. There are two sources: 1. Memory Tracker is not bound in TLS, and `Doris Allocator` records the memory in Orphan by default; 2. If Current Consumption is not equal to 0 when Memory Tracker is destroyed, it usually means that this part of memory has not been released, and the remaining memory will be recorded in Orphan.
- DataPageCache\[size\](AllocByAllocator): used to cache data Pages to speed up Scan. `[size]` means that Tracker records the memory size, and `(AllocByAllocator)` means that the Tracker value is recorded by `Doris Allocator`.
- IndexPageCache\[size\](AllocByAllocator): used to cache the index of data Page to speed up Scan.
- PKIndexPageCache\[size\](AllocByAllocator): used to cache the primary key index of Page to speed up Scan.
- DetailsTrackerSet:
Contains some manually tracked memory that is not allocated using `Doris Allocator`, including metadata memory composed of various `ProtoBuffer`, BRPC memory, etc. By default, only the Memory Tracker with Peak Consumption not equal to 0 is displayed.
- SegmentCache[size]: Caches the memory size of the opened Segment, such as index information.
- SchemaCache[number]: Caches the number of entries of the Rowset Schema, `[number]` means that the Tracker records the number of cached entries.
- TabletSchemaCache[number]: Caches the number of entries of the Tablet Schema.
- TabletMeta(experimental): The memory size of all Tablet Schemas, `(experimental)` means that this Memory Tracker is still in the experiment and the value may not be accurate.
- CreateTabletRRIdxCache[number]: Caches the number of entries of the create tabelt index.
- PageNoCache: If page cache is turned off, this Memory Trakcer will track the total page memory used by all queries.
- IOBufBlockMemory: The total IOBuf memory used by BRPC.
- PointQueryLookupConnectionCache[number]: The number of cached Point Query Lookup Connection entries.
- AllMemTableMemory: The total Memtable memory of all imports cached in memory waiting to be flushed,
- MowTabletVersionCache[number]: The number of cached Mow Tablet Version entries.
- MowDeleteBitmapAggCache[size]: The cached Mow DeleteBitmap memory size.
- SegCompaction: The total memory allocated from `Doris Allocator` by all SegCompaction tasks.
- PointQueryExecutor: Some memory allocated from `Doris Allocator` shared by all Point Queries.
- BlockCompression: Some memory allocated from `Doris Allocator` during decompression shared by all Queries.
- RowIdStorageReader: All multiget data requests use memory allocated from `Doris Allocator` in RowIdStorageReader.
- SubcolumnsTree: Some memory allocated from `Doris Allocator` in Point Query in SubcolumnsTree.
- S3FileBuffer: Some memory allocated from `Doris Allocator` in File Buffer when reading S3.

### Query Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=query`
![image](https://github.com/apache/doris/assets/13197424/3adac2fc-9f20-4c0f-9c84-4439cebd101c)
Shows the Memory Tracker of `type=query`.

- `Query#Id=QueryID`
The Memory Tracker with label starting with `Query#Id=` is unique for each Query and is the total memory allocated by this Query from `Doris Allocator`.
Limit: The upper limit of memory used by a single query. `show session variables` can be used to view and modify `exec_mem_limit`.
- The Memory Tracker with parent label `Query#Id=QueryID` records the memory used by different operators during the execution of this query and is a subset of the Query Memory Tracker.

### Load Type `http://{be_host}:{be_web_server_port}/mem_tracker?type=load`
![image](https://github.com/apache/doris/assets/13197424/767d2404-7a29-4fed-96f8-bf5c8575e7dd)
Show the Memory Tracker with `type=load`.

- `Load#Id=LoadID`
The Memory Tracker with label starting with `Load#Id=` is unique for each Load and is the total memory allocated by this Load from `Doris Allocator`.
Limit: The upper limit of memory used by a single Load. `show session variables` can be used to view and modify `exec_mem_limit`.
- The Memory Tracker with parent label `Load#Id=LoadID` records the memory used by different operators during the execution of this Load Fragment and is a subset of the Load Memory Tracker.
- MemTableManualInsert:TabletId=248915:MemTableNum=1#loadID=LoadID : The memory allocated during the insert phase of a MemTable is a subset of the Load Memory Tracker.
- MemTableHookFlush:TabletId=248891:MemTableNum=1#loadID=LoadID: Memory allocated during a MemTable flush, a subset of the Load Memory Tracker.
- MemTableTrackerSet: The common Parent Tracker of all MemTable Memory Trackers, with no actual value, because the MemTable insert and flush phases may not be on the same BE node as the Load Fragment.

## Memory Tracker Structure

Memory Tracker is divided into two categories according to usage. The first category, Memory Tracker Limiter, is unique in each query, import, Compaction and other tasks and global Cache, TabletMeta, and is used to observe and control memory usage; the second category, Memory Tracker, is mainly used to track memory hotspots during query execution, such as HashTable in Join/Aggregation/Sort/window functions, serialized intermediate data, etc., to analyze the memory usage of different operators in the query, and for memory control of imported data flushing.

The parent-child relationship between the two is only used for snapshot printing, and is associated with Lable names, which is equivalent to a layer of soft links. It does not rely on the parent-child relationship for simultaneous consumption, and the life cycle does not affect each other, reducing the cost of understanding and use. All Memory Trackers are stored in a group of Maps, and provide methods for printing snapshots of all Memory Tracker Types, printing snapshots of Tasks such as Query/Load/Compaction, obtaining a group of queries/loads that currently use the most memory, and obtaining a group of queries/loads that currently use the most memory.

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Analysis of Memory Tracker Memory Usage Excessive

The above introduces the real-time viewing of memory statistics through the Doris BE Web page `http://{be_host}:{be_web_server_port}/mem_tracker`. In addition, when the error process memory exceeds the limit or the available memory is insufficient, the `Memory Tracker Summary` can be found in the `be/log/be.INFO` log, which contains all the Memory Trackers of `Type=overview` and `Type=global`, to help users analyze the memory status at the time. For the analysis of memory logs, refer to the [Insufficient Available Memory for Processes] section in [Memory Limit Exceeded Analysis](./memory-limit-exceeded-analysis).

The following analyzes the reasons why different Memory Trackers occupy too much memory and how to reduce their memory usage. For the meaning of each part of Memory Tracker, refer to the explanation in [View Real-time Statistics] above.

### 1 `Label=query, Type=overview` Query memory usage is high

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

First locate the QueryID of the large memory query. In the BE web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=query`, you can see the real-time large memory query by sorting by `Current Consumption`. You can find the QueryID in `label`.

When the error process memory exceeds the limit or the available memory is insufficient, the lower part of the `Memory Tracker Summary` in the `be.INFO` log contains the Memory Tracker of the top 10 tasks (query/import/compaction, etc.) with the highest memory usage. The format is `MemTrackerLimiter Label=Query#Id=xxx, Type=query`. Usually, the QueryID of the large memory query can be located in the top 10 tasks.

After locating the QueryID of the large memory query, refer to [Query Memory Analysis] in [Memory Analyze Manual](./memory-analyze-manual) to analyze the memory usage of the query.

The memory statistics of historical queries can be viewed in `peakMemoryBytes` of each query in `fe/log/fe.audit.log`, or search `Deregister query/load memory tracker, queryId` in `be/log/be.INFO` to view the peak memory usage of each query on a single BE.

### 2 `Label=load, Type=overview` or `Label=AllMemTableMemory` uses too much imported memory

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

The memory imported by Doris is divided into two parts. The first part is the memory used by Fragment execution, and the second part is the memory used in the construction and flushing of `MemTable`.

The Memory Tracker with `Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` found in the BE web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` is the memory used by all imported tasks to construct and flush `MemTable` on this BE node. When the error process memory exceeds the limit or the available memory is insufficient, you can also find this Memory Tracker in the `Memory Tracker Summary` in the `be.INFO` log.

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

If the value of ``Label=AllMemTableMemory` is very small, the main memory used by the import task is the execution fragment. The analysis method is the same as the above analysis of the query memory of `Label=query`, which will not be repeated here.

If the value of ``Label=AllMemTableMemory` is large, it is possible that `MemTable` is not flushed in time. You can consider reducing the values ​​of `load_process_max_memory_limit_percent` and `load_process_soft_mem_limit_percent` in `be.conf`, which can make `MemTable` flush more frequently, so that less `MemTable` is cached in memory.

During the import execution process, check the BE web page `/mem_tracker?type=load`. According to the values ​​of the two memory trackers `Label=MemTableManualInsert` and `Label=MemTableHookFlush`, you can locate the `LoadID` and `TabletID` with large `MemTable` memory usage.

### 3 `Label=tc/jemalloc_cache, Type=overview` Jemalloc or TCMalloc Cache uses too much memory

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Before Doris 2.1.6, `Label=tc/jemalloc_cache` also includes Jemalloc Metadata, and it is likely that the large memory usage of Jemalloc Metadata causes `Label=tc/jemalloc_cache` to be too large. Refer to the analysis of `Label=tc/jemalloc_metadata` Memory Tracker.

Doris uses Jemalloc as the default Allocator, so here we only analyze the situation where Jemalloc Cache uses too much memory.

During the running of BE process, Jemalloc Cache consists of two parts.
- Thread Cache, cache a specified number of Pages in Thread Cache, refer to [Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache).
- Dirty Page, memory Page that can be reused in all Arenas.

Check Doris BE's web page `http://{be_host}:{be_web_server_port}/memz` (webserver_port defaults to 8040) to get Jemalloc Profile, and interpret the use of Jemalloc Cache based on several sets of key information.

#### 3.1 If the value of `tcache_bytes` in Jemalloc Profile is large

`tcache_bytes` in Jemalloc Profile is the total number of bytes of Jemalloc Thread Cache. If the value of `tcache_bytes` is large, it means that the memory used by Jemalloc Thread Cache is too large. It may be that `tcache` caches a large number of large pages, because the upper limit of `tcache` is the number of pages, not the total number of bytes of pages.

Consider reducing `lg_tcache_max` in `JEMALLOC_CONF` in `be.conf`. `lg_tcache_max` is the upper limit of the size of the page bytes allowed to be cached. The default value is 15, that is, 32 KB (2^15). Pages exceeding this size will not be cached in `tcache`. `lg_tcache_max` corresponds to `Maximum thread-cached size class` in Jemalloc Profile.

This is usually because the query or import in the BE process is applying for a large number of memory pages of large size classes, or after executing a large memory query or import, a large number of memory pages of large size classes are cached in `tcache`. `tcache` has two cleaning opportunities. One is to recycle the memory blocks that have not been used for a long time when the memory application and release reach a certain number of times; the other is to recycle all `tcache` when the thread exits. At this time, there is a bad case. If the thread has not executed new queries or imports in the future, it will no longer allocate memory and fall into a so-called idle state. Users expect that the memory can be released after the query is completed, but in fact, if the thread does not exit in this scenario, `tcache` will not be cleaned.

However, there is usually no need to pay attention to Thread Cache. When the process has insufficient available memory, if the size of Thread Cache exceeds 1G, Doris will manually flush Thread Cache.

#### 3.2. If the sum of the values ​​of the `dirty` column in the `extents` table in Jemalloc Profile is large

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

Reduce `dirty_decay_ms` of `JEMALLOC_CONF` in `be.conf` to 2000 ms or less. The default `dirty_decay_ms` in `be.conf` is 5000 ms. Jemalloc will release dirty pages according to a smooth gradient curve within the time specified by `dirty_decay_ms`. For reference, [Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms). When the BE process has insufficient available memory and triggers Minor GC or Full GC, it will actively release all dirty pages according to a certain strategy.

`extents` in Jemalloc Profile contains the statistical values ​​of buckets of different page sizes in all Jemalloc `arena`, where `ndirty` is the number of dirty pages and `dirty` is the total memory of dirty pages. Refer to `stats.arenas.<i>.extents.<j>.{extent_type}_bytes` in [Jemalloc](https://jemalloc.net/jemalloc.3.html) and add up the `dirty` of all Page Sizes to get the memory byte size of the Dirty Page in Jemalloc.

### 4 `Label=tc/jemalloc_metadata, Type=overview` Jemalloc or TCMalloc Metadata uses a lot of memory

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` Memory Tracker was added after Doris 2.1.6. In the past, Jemalloc Metadata was included in `Label=tc/jemalloc_cache`.

Doris uses Jemalloc as the default Allocator, so here we only analyze the situation where Jemalloc Metadata uses a lot of memory.

Check the Doris BE web page `http://{be_host}:{be_web_server_port}/memz` (webserver_port defaults to 8040) to get the Jemalloc Profile. Find the overall memory statistics of Jemalloc in the Jemalloc Profile as follows, where `metadata` is the memory size of Jemalloc Metadata.

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`
- `Allocated` The total number of bytes of memory allocated by Jemalloc for the BE process.
- `active` The total number of bytes of all pages allocated by Jemalloc for the BE process, which is a multiple of Page Size and is usually greater than or equal to `Allocated`.
- `metadata` The total number of bytes of Jemalloc metadata, which is related to the number of allocated and cached pages, memory fragmentation and other factors. Refer to the document [Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata)
- `retained` The size of the virtual memory mapping retained by Jemalloc, which is not returned to the operating system through munmap or similar methods, and is not strongly associated with physical memory. Refer to the document [Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained)

The size of Jemalloc Metadata is positively correlated with the size of the process virtual memory. Usually, the large virtual memory of the Doris BE process is because Jemalloc retains a large number of virtual memory mappings, that is, the above `retained`. By default, the virtual memory returned to Jemalloc is cached in Retained, waiting to be reused. It will not be released automatically or manually.

The fundamental reason for the large size of Jemalloc Retained is the insufficient memory reuse at the Doris code level, which requires a large amount of virtual memory to be applied. After these virtual memories are released, they enter Jemalloc Retained. Usually, the ratio of virtual memory to Jemalloc Metadata size is between 300-500, that is, if there is 10T of virtual memory, Jemalloc Metadata may occupy 20G.

If you encounter the problem of Jemalloc Metadata and Retained continuing to increase, and the process virtual memory is too large, it is recommended to consider restarting Doris BE regularly every week or month. Usually this only occurs after Doris BE has been running for a long time, and only a few Doris clusters will encounter it. There is currently no way to reduce the virtual memory mapping retained by Jemalloc Retained without losing performance. Doris is continuously optimizing memory usage.

If the above problems occur frequently, refer to the following methods.
1. A fundamental solution is to turn off the Jemalloc Retained cache virtual memory mapping, add `retain:false` after `JEMALLOC_CONF` in `be.conf` and restart BE. However, query performance may be significantly reduced, and the performance of the TPC-H benchmark test will be reduced by about 3 times.
2. On Doris 2.1, you can turn off pipelinex and pipeline, and execute `set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`, because pipelinex and pipeline will apply for more virtual memory. This will also lead to reduced query performance.

### 5 `Label=global, Type=overview` Global memory usage is high

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

The value of `Label=global, Type=overview` is equal to the sum of all Memory Trackers with `Type=global` and `Parent Label != DetailsTrackerSet` in `Memory Tracker Summary`. Global memory mainly includes memory shared between different tasks such as Cache and metadata. For details, please refer to the introduction of `type=global` in [Memory Tracker](./memory-tracker.md).

There are various caches when Doris BE is running. Usually, you don't need to pay attention to the cache memory, because when the available memory of the BE process is insufficient, the memory GC will be triggered to clean up the cache first. However, if the cache is too large, it will increase the pressure of Memroy GC, increase the risk of insufficient available memory for query or import error process, and the risk of BE process OOM Crash. Therefore, if the memory is continuously tight, you can consider reducing the upper limit of the cache, closing the cache, or reducing the survival time of the cache entry. A smaller cache may reduce query performance in some scenarios, but it can usually be tolerated in a production environment. After adjustment, you can observe the query and import performance for a period of time. If you want to manually clean up all caches during BE operation, execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`, and the released memory size will be returned.

The following analyzes the common situation of high memory usage of Global Memory Tracker.

#### 5.1 `Label=DataPageCache` uses too much memory

```
MemTrackerLimiter Label=DataPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=198.70 MB(208357157 B), Peak=198.73 MB(208381892 B)
```

The memory size of cached data Page.

- Execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` to manually clear it during BE operation.
- Execute `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true` to disable `DataPageCache` for the running BE, and clear it after a maximum of 10 minutes by default. However, this is a temporary method. `DataPageCache` will take effect again after BE restarts.
- If you are sure that you want to reduce the memory usage of `DataPageCache` for a long time, refer to [BE Configuration Items](../../admin-manual/config/be-config.md), reduce `storage_page_cache_limit` in `conf/be.conf` to reduce the capacity of `DataPageCache`, or reduce `data_page_cache_stale_sweep_time_sec` to reduce the effective time of `DataPageCache` cache, or increase `disable_storage_page_cache=true` to disable `DataPageCache`, and then restart the BE process.

#### 5.2 `Label=SegmentCache` uses too much memory

```
MemTracker Label=SegmentCache[size], Parent Label=DetailsTrackerSet, Used=1.64 MB(1720543 B), Peak=18.78 MB(19691997 B)
```

The memory size of the cached Segment.

- Execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` to manually clear it during BE operation.
- Execute `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true` to disable `SegmentCache` for the running BE, and it will be cleared after a maximum of 10 minutes by default, but this is a temporary method, and `SegmentCache` will take effect again after BE restarts.
- If you are sure that you want to reduce the memory usage of `SegmentCache` for a long time, refer to [BE configuration items](../../admin-manual/config/be-config.md), adjust `segment_cache_capacity` or `segment_cache_memory_percentage` in `conf/be.conf` to reduce the capacity of `SegmentCache`, or reduce `tablet_rowset_stale_sweep_time_sec` to reduce the effective cache time of `SegmentCache`, or add `disable_segment_cache=true` in `conf/be.conf` to disable `SegmentCache` and restart the BE process.

#### 5.3 `Label=PKIndexPageCache` uses too much memory

```
MemTrackerLimiter Label=PKIndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

The memory size of the cache data Page primary key index.

- Execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` to manually clean it up during BE operation.
- Refer to [BE Configuration Items](../../admin-manual/config/be-config.md), reduce `pk_storage_page_cache_limit` in `conf/be.conf` to reduce the capacity of `PKIndexPageCache`, or reduce `pk_index_page_cache_stale_sweep_time_sec` to reduce the effective time of `DataPageCache` cache, or add `disable_pk_storage_page_cache=true` in `conf/be.conf` to disable `PKIndexPageCache`, and then restart the BE process.

#### 5.4 `Label=Orphan` uses too much memory

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

`Orphan` is the default Memory Tracker used by `Doris Allocator`. If no other Memory Tracker is attached at the beginning of the thread, then by default `Doris Allocator` will record the allocated memory in the Orphan Memory Tracker, so `Orphan Memory Tracker Consumption` plus `Othre Memory Tracker Limiter Consumption` equals all the memory allocated by `Doris Allocator`.

For details about the principle of tracking `Doris Allocator` memory allocation, please refer to [Memory Tracker](./memory-tracker.md). Ideally, we hope that all threads will attach a Memory Tracker other than Orphan at the beginning, so we expect the value of `Orphan Memory Tracker Consumption` to be close to 0.

> Before Doris 2.1.5, SegmentCache memory is actually counted in Orphan Memory Tracker and is not effectively restricted, which often leads to too large values ​​of Orphan Memory Tracker. Therefore, before Doris 2.1.5, if the value of Orphan Memory Tracker is too large, please refer to the `Label=SegmentCache Memory Usage Excessive` section to turn off SegmentCache.

### 6 `Label=process virtual memory, Type=overview` Process virtual memory is too large

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```

Usually, the large virtual memory of Doris BE process is because Jemalloc retains a large number of virtual memory mappings. You can refer to the analysis of `Label=tc/jemalloc_metadata` Memory Tracker.
