---
{
    "title": "查询报错 Memory Tracker Limit Exceeded",
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

当查询或导入的报错信息中出现 `MEM_LIMIT_EXCEEDED` 且包含 `memory tracker limit exceeded` 时，说明任务超过单次执行内存限制。

## 错误信息解析

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

错误信息分为两部分：

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`：当前正在执行 Query `f78208b15e064527-a84c5c0b04c04fcf` 在尝试申请 1.03 MB 内存的过程中发现查询超过单次执行的内存上限，查询内存上限是 100 MB（Session Variables 中的 `exec_mem_limit`），当前已经使用 99.25 MB，内存峰值是 99.29 MB。

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`：本次内存申请的位置是`VHASH_JOIN_NODE (id=4)`，并提示可通过 `set exec_mem_limit` 来调高单次查询的内存上限。

## 单次执行内存限制和内存超发

`show variables;` 可以查看 Doris Session Veriable，其中的 `exec_mem_limit` 是单次查询和导入的执行内存限制，但从 Doris 1.2 开始支持查询内存超发 (overcommit)，旨在允许查询设置更灵活的内存限制，内存充足时即使查询内存超过上限也不会被 Cancel，所以通常用户无需关注查询内存使用。直到内存不足时，查询会在尝试分配新内存时等待一段时间，此时会基于一定规则优先 Cancel `mem_used` 与 `exec_mem_limit` 比值大的 Query。如果等待过程中内存释放的大小满足需求，查询将继续执行，否则将抛出异常并终止查询。

如果希望关闭查询内存超发，参考 [BE 配置项](../../../config/be-config)，在 `conf/be.conf` 中增加 `enable_query_memory_overcommit=false`，此时单次查询和导入的内存超过 `exec_mem_limit` 即会被 Cancel。如果你希望避免大查询对集群稳定性造成的负面影响，或者希望准确控制集群上的任务执行来保证足够的稳定性，那么可以考虑关闭查询内存超发。

## 查询内存分析

如果需要分析查询的内存使用，参考 [查询内存分析](./query-memory-analysis.md)。

`set enable_profile=true` 开启 Query Profile 后，在任务超过单次执行的内存上限时，在 `be/log/be.INFO` 将打印查询正在申请内存的调用栈，并可以看到查询每个算子当前使用的内存和峰值，参考 [内存日志分析](./memory-log-analysis.md) 分析 `Process Memory Summary` 和 `Memory Tracker Summary`，帮助确认当前查询内存使用是否符合预期。

```sql
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

5. Point Query Cache

加速点查询执行，主要用于日志分析。

```
- PointQueryRowCache
- PointQueryLookupConnectionCache
```

6. Other Cache

```
- FileCache: 外表查询和 Cloud 使用的文件缓存。
- CommonObjLRUCache
- LastSuccessChannelCache
```

## Doris Cache 查看方法

有三种方式查看 Doris Cache 相关指标。

1. Doris BE Metrics

Web 页面 `http://{be_host}:{be_web_server_port}/metrics` 可以看到 BE 进程内存监控 (Metrics)，包括每个 Cache 的容量、使用率、元素个数、查找和命中次数等指标。

```
- `doris_be_cache_capacity{name="TabletSchemaCache"} 102400`：Cache 容量，内存大小或者元素个数两种限制方法。
- `doris_be_cache_usage{name="TabletSchemaCache"} 40838`：Cache 使用量，内存大小或者元素个数，对应 Cache 容量的限制。
- `doris_be_cache_usage_ratio{name="TabletSchemaCache"} 0.398809`：Cache 使用率，等于`(cache_usage / cache_capacity)`。
- `doris_be_cache_element_count{name="TabletSchemaCache"} 1628`：Cache 元素个数，当 Cache 容量限制元素个数时等于 Cache Usage。
- `doris_be_cache_lookup_count{name="TabletSchemaCache"} 63393`：查找 Cache 的次数。
- `doris_be_cache_hit_count{name="TabletSchemaCache"} 61765`：查找 Cache 时命中的次数。
- `doris_be_cache_hit_ratio{name="TabletSchemaCache"} 0.974319`：命中率，等于`(hit_count / lookup_count)`
```

2. Doris BE Bvar

Web 页面 `http://{be_host}:{brpc_port}/vars/*cache*` 可以看到部分 Cache 独有的一些指标。

> 未来会将 Doris BE Metrics 中的指标移动到 Doris BE Bvar 中。

3. Memory Trakcer

实时查看每个 Cache 占用内存大小，参考 [全局内存分析](./global-memory-analysis.md)，当存在内存报错时在 `be/log/be.INFO` 日志中可以找到 `Memory Tracker Summary` 中，其中包含当时的 Cache 内存大小。

## Cache 内存分析

Doris BE 运行时存在各种 Cache，通常无需关注 Cache 内存，因为在 BE 进程可用内存不足时会触发内存 GC 首先清理 Cache。

但 Cache 过大会增加内存 GC 的压力，增加查询或导入报错进程可用内存不足的风险，以及 BE 进程 OOM Crash 的风险。所以如果内存持续紧张，可以考虑优先降低 Cache 的上限、关闭 Cache 或降低 Cache entry 的存活时间，更小的 Cache 在某些场景中可能会降低查询性能，但在生产环境中通常可以被容忍，调整后可以观察一段时间的查询和导入的性能。

> Doris 2.1 之前 Memory GC 还不完善，内存不足时可能无法及时释放 Cache，如果内存持续紧张，常常需要考虑手动降低 Cache 上限。

Doris 2.1.6 之后，如果希望在 BE 运行中手动清理所有 Cache，执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`，将返回释放的内存大小。

下面分析不同 Cache 内存使用多的情况。

### DataPageCache 内存使用多

- Doris 2.1.6 之后，执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` 可以在 BE 运行中手动清理。

- 执行 `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true` 对正在运行的 BE 禁用 DataPageCache，并默认在最长 10 分钟后清空，但这是临时方法，BE 重启后 DataPageCache 将重新生效。

- 若确认要长期减少 DataPageCache 的内存使用，参考 [BE 配置项](../../../config/be-config)，在 `conf/be.conf` 中调小 `storage_page_cache_limit` 减小 DataPageCache 的容量，或调小 `data_page_cache_stale_sweep_time_sec` 减小 DataPageCache 缓存有效时长，或增加 `disable_storage_page_cache=true` 禁用 DataPageCache，然后重启 BE 进程。

### SegmentCache 内存使用多

- Doris 2.1.6 之后，执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` 可以在 BE 运行中手动清理。

- 执行 `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true` 对正在运行的 BE 禁用 SegmentCache，并默认在最长 10 分钟后清空，但这是临时方法，BE 重启后 SegmentCache 将重新生效。

- 若确认要长期减少 SegmentCache 的内存使用，参考 [BE 配置项](../../../config/be-config)，在 `conf/be.conf` 中调整 `segment_cache_capacity` 或 `segment_cache_memory_percentage` 减小 SegmentCache 的容量，或调小 `tablet_rowset_stale_sweep_time_sec` 减小 SegmentCache 缓存有效时长，或者在 `conf/be.conf` 中增加 `disable_segment_cache=true` 禁用 SegmentCache 并重启 BE 进程。

### PKIndexPageCache 内存使用多

- Doris 2.1.6 之后，执行 `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` 可以在 BE 运行中手动清理。

- 参考 [BE 配置项](../../../config/be-config)，在 `conf/be.conf` 中调小 `pk_storage_page_cache_limit` 减小 PKIndexPageCache 的容量，或调小 `pk_index_page_cache_stale_sweep_time_sec` 减小 PKIndexPageCache 缓存有效时长，或者在 `conf/be.conf` 中增加 `disable_pk_storage_page_cache=true` 禁用 PKIndexPageCache，然后重启 BE 进程。
