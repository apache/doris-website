---
{
    "title": "Jemalloc Memory Analysis",
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

Doris uses Jemalloc as the general memory allocator by default. The memory occupied by Jemalloc itself includes Cache and Metadata. Cache includes Thread Cache and Dirty Page. You can view the original profile of the memory allocator in real time at http://{be_host}:{be_web_server_port}/memz.

## Jemalloc Cache Memory Analysis

If you see a large value of `Label=tc/jemalloc_cache, Type=overview` Memory Trakcer, it means that Jemalloc or TCMalloc Cache uses a lot of memory. Doris uses Jemalloc as the default Allocator, so here we only analyze the situation where Jemalloc Cache uses a lot of memory.

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Before Doris 2.1.6, `Label=tc/jemalloc_cache` also includes Jemalloc Metadata, and it is likely that the large memory usage of Jemalloc Metadata causes `Label=tc/jemalloc_cache` to be too large. Refer to the analysis of `Label=tc/jemalloc_metadata` Memory Tracker.

During the running of the BE process, Jemalloc Cache consists of two parts.

- Thread Cache, cache a specified number of Pages in Thread Cache, refer to [Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache).

- Dirty Page, all memory Pages that can be reused in Arena.

### Jemalloc Cache View Method

View Doris BE's Web page `http://{be_host}:{be_web_server_port}/memz` (webserver_port defaults to 8040) to obtain Jemalloc Profile, and interpret the use of Jemalloc Cache based on several sets of key information.

- `tcache_bytes` in Jemalloc Profile is the total number of bytes of Jemalloc Thread Cache. If the `tcache_bytes` value is large, it means that the memory used by Jemalloc Thread Cache is too large.

- The sum of the values ​​of the `dirty` column in the `extents` table in the Jemalloc Profile is large, indicating that the memory used by the Jemalloc Dirty Page is too large.

### Thread Cache Memory is Too Large

It may be that the Thread Cache caches a large number of large pages, because the upper limit of the Thread Cache is the number of pages, not the total number of bytes of the pages.

Consider reducing `lg_tcache_max` in `JEMALLOC_CONF` in `be.conf`. `lg_tcache_max` is the upper limit of the byte size of the page allowed to be cached. The default value is 15, that is, 32 KB (2^15). Pages exceeding this size will not be cached in the Thread Cache. `lg_tcache_max` corresponds to `Maximum thread-cached size class` in the Jemalloc Profile.

This is usually because the query or import in the BE process is applying for a large number of memory pages of large size classes, or after executing a large memory query or import, a large number of memory pages of large size classes are cached in the Thread Cache. There are two times to clean up the Thread Cache. One is to recycle the memory blocks that have not been used for a long time when the memory application and release reach a certain number of times; the other is to recycle all pages when the thread exits. At this time, there is a Bad Case. If the thread has not executed new queries or imports in the future, it will no longer allocate memory and fall into a so-called `idle` state. Users expect that the memory can be released after the query is completed, but in fact, in this scenario, if the thread does not exit, the Thread Cache will not be cleaned.

However, there is usually no need to pay attention to the Thread Cache. When the available memory of the process is insufficient, if the size of the Thread Cache exceeds 1G, Doris will manually flush the Thread Cache.

### Dirty Page Memory Too Large
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

## Jemalloc Metadata Memory Analysis

If the value of `Label=tc/jemalloc_metadata, Type=overview` Memory Trakcer is large, it means that Jemalloc or TCMalloc Metadata uses a lot of memory. Doris uses Jemalloc as the default Allocator, so here we only analyze the situation where Jemalloc Metadata uses a lot of memory.

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` Memory Tracker was added after Doris 2.1.6. In the past, Jemalloc Metadata was included in `Label=tc/jemalloc_cache` Memory Tracker.

### How to view Jemalloc Metadata

You can get the Jemalloc Profile by viewing the Doris BE web page `http://{be_host}:{be_web_server_port}/memz` (webserver_port defaults to 8040). Find the overall memory statistics of Jemalloc in the Jemalloc Profile as follows, where `metadata` is the memory size of Jemalloc Metadata.

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`

- `Allocated` The total number of bytes of memory allocated by Jemalloc for the BE process.

- `active` The total number of bytes of all pages allocated by Jemalloc for the BE process, which is a multiple of Page Size and is usually greater than or equal to `Allocated`.

- `metadata` The total number of bytes of Jemalloc metadata, which is related to the number of allocated and cached pages, memory fragmentation and other factors. Refer to the document [Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata)

- `retained` The size of the virtual memory mapping retained by Jemalloc, which is not returned to the operating system through munmap or similar methods, and is not strongly associated with physical memory. Reference document [Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained)

### Jemalloc Metadata memory is too large

The size of Jemalloc Metadata is positively correlated with the size of process virtual memory. Usually, the virtual memory of Doris BE process is large because Jemalloc retains a large number of virtual memory mappings, that is, the above `retained`. The virtual memory returned to Jemalloc is cached in Retained by default, waiting to be reused, and will not be released automatically or manually.

The fundamental reason for the large size of Jemalloc Retained is that the memory reuse at the Doris code level is insufficient, resulting in the need to apply for a large amount of virtual memory, which enters Jemalloc Retained after being released. Usually, the ratio of virtual memory to Jemalloc Metadata size is between 300-500, that is, if there is 10T of virtual memory, Jemalloc Metadata may occupy 20G.

If you encounter problems with Jemalloc Metadata and Retained continuing to increase, and the process virtual memory is too large, it is recommended to consider restarting the Doris BE process regularly. Usually this only occurs after Doris BE has been running for a long time, and only a few Doris clusters will encounter it. There is currently no way to reduce the virtual memory mapping retained by Jemalloc Retained without losing performance. Doris is continuously optimizing memory usage.

If the above problems occur frequently, refer to the following methods.

1. A fundamental solution is to turn off the Jemalloc Retained cache virtual memory mapping, add `retain:false` after `JEMALLOC_CONF` in `be.conf`, and restart BE. However, query performance may be significantly reduced, and the performance of the TPC-H Benchmark test will be reduced by about 3 times.

2. On Doris 2.1, you can turn off Pipelinex and Pipeline by executing `set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`, because pipelinex and pipeline will apply for more virtual memory. This will also lead to reduced query performance.
