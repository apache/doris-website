---
{
    "title": "Cache Memory Analysis",
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

The caches managed by Doris are currently all LRU elimination strategies, and all support controlling the capacity and elimination time through parameters separately.

## Doris Cache Type

1. Page Cache

Used to speed up data scanning.

```
- DataPageCache: Cache data Page.
- IndexPageCache: Cache data Page index.
- PKIndexPageCache: Cache Page primary key index.
```

2. Metadata Cache

Used to speed up metadata reading.

```
- SegmentCache: Cache open Segments, such as index information.
- SchemaCache: Cache Rowset Schema.
- TabletSchemaCache: Cache Tablet Schema.
- CreateTabletRRIdxCache: Cache Create Tabelt index.
- MowTabletVersionCache: Cache Mow Tablet Version.
- MowDeleteBitmapAggCache: Cache Mow DeleteBitmap.
```

3. Cloud Cache

A dedicated cache on the cloud.

```
- CloudTabletCache: Cache Tablet on the Cloud.
- CloudTxnDeleteBitmapCache: Cache DeleteBitmap on Cloud.
```

4. Inverted Index Cache

Speed ​​up inverted index.

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
```

5. Point Query Cache

Speed ​​up point query execution, mainly used for log analysis.

```
- PointQueryRowCache
- PointQueryLookupConnectionCache
```

6. Other Cache

```
- FileCache: File cache used by external table queries and Cloud.

- CommonObjLRUCache
- LastSuccessChannelCache
```

## Doris Cache View Method

There are three ways to view Doris Cache related indicators.

1. Doris BE Metrics

Web page `http://http://{be_host}:{be_web_server_port}/metrics` can see BE process memory monitoring (Metrics), including each cache capacity, usage, number of elements, search and hit times and other indicators.

```
- `doris_be_cache_capacity{name="TabletSchemaCache"} 102400`: Cache capacity, two limiting methods: memory size or number of elements.
- `doris_be_cache_usage{name="TabletSchemaCache"} 40838`: Cache usage, memory size or number of elements, corresponding to the limit of cache capacity.
- `doris_be_cache_usage_ratio{name="TabletSchemaCache"} 0.398809`: Cache usage, equal to `(cache_usage / cache_capacity)`.
- `doris_be_cache_element_count{name="TabletSchemaCache"} 1628`: Number of cache elements, equal to Cache Usage when the cache capacity limits the number of elements.
- `doris_be_cache_lookup_count{name="TabletSchemaCache"} 63393`: Number of cache lookups.
- `doris_be_cache_hit_count{name="TabletSchemaCache"} 61765`: Number of hits when looking up the cache.
- `doris_be_cache_hit_ratio{name="TabletSchemaCache"} 0.974319`: Hit ratio, equal to `(hit_count / lookup_count)`
```

2. Doris BE Bvar

Web page `http://http://{be_host}:{brpc_port}/vars/*cache*` can show some unique metrics of some caches.

> In the future, the indicators in Doris BE Metrics will be moved to Doris BE Bvar.

3. Memory Trakcer

To view the memory size occupied by each cache in real time, refer to [Global Memory Analysis](./global-memory-analysis.md). When there is a memory error, you can find the `Memory Tracker Summary` in the `be/log/be.INFO` log, which contains the cache memory size at that time.

## Doris Cache Memory Analysis

There are various caches when Doris BE is running. Usually, there is no need to pay attention to the cache memory, because when the BE process has insufficient available memory, the memory GC will be triggered to clean up the cache first.

However, if the cache is too large, it will increase the pressure of memory GC, increase the risk of insufficient available memory for query or import error processes, and increase the risk of BE process OOM Crash. So if the memory is constantly tight, you can consider lowering the upper limit of the cache, closing the cache, or reducing the survival time of the cache entry. A smaller cache may reduce query performance in some scenarios, but it is usually tolerable in a production environment. After adjustment, you can observe the query and import performance for a period of time.

After Doris 2.1.6, if you want to manually clean up all caches during BE operation, execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`, and the released memory size will be returned.

The following analyzes the situation where different caches use more memory.

### DataPageCache uses more memory

- After Doris 2.1.6, execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` to manually clean up during BE operation.

- Execute `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true` to disable DataPageCache for the running BE, and clear it after a maximum of 10 minutes by default. However, this is a temporary method. DataPageCache will take effect again after BE restarts.

- If you are sure that you want to reduce the memory usage of DataPageCache for a long time, refer to [BE Configuration Items](../../admin-manual/config/be-config.md), reduce `storage_page_cache_limit` in `conf/be.conf` to reduce the capacity of DataPageCache, or reduce `data_page_cache_stale_sweep_time_sec` to reduce the effective time of DataPageCache cache, or increase `disable_storage_page_cache=true` to disable DataPageCache, and then restart the BE process.

### SegmentCache uses a lot of memory

- After Doris 2.1.6, execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` to manually clean up during BE operation.

- Execute `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true` to disable SegmentCache for the running BE, and clear it after a maximum of 10 minutes by default, but this is a temporary method, and SegmentCache will take effect again after BE restarts.

- If you are sure that you want to reduce the memory usage of SegmentCache for a long time, refer to [BE Configuration Items](../../admin-manual/config/be-config.md), adjust `segment_cache_capacity` or `segment_cache_memory_percentage` in `conf/be.conf` to reduce the capacity of SegmentCache, or reduce `tablet_rowset_stale_sweep_time_sec` to reduce the effective time of SegmentCache cache, or add `disable_segment_cache=true` in `conf/be.conf` to disable SegmentCache and restart the BE process.

### PKIndexPageCache uses a lot of memory

- After Doris 2.1.6, execute `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` to manually clean up during BE operation.

- Refer to [BE configuration items](../../admin-manual/config/be-config.md), reduce the capacity of PKIndexPageCache by lowering `pk_storage_page_cache_limit` in `conf/be.conf`, or reduce the effective time of PKIndexPageCache by lowering `pk_index_page_cache_stale_sweep_time_sec`, or add `disable_pk_storage_page_cache=true` in `conf/be.conf` to disable PKIndexPageCache, and then restart the BE process.
