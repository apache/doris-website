---
{
    "title": "Cache 内存分析",
    "language": "zh-CN",
    "description": "Doris 自己管理的 Cache 目前均为 LRU 淘汰策略，均支持单独通过参数控制容量和淘汰时长。"
}
---

Doris 自己管理的 Cache 目前均为 LRU 淘汰策略，均支持单独通过参数控制容量和淘汰时长。

## Doris Cache 类型

1. Page Cache

用于加速数据扫描。

```
- DataPageCache: 缓存数据 Page。
- IndexPageCache: 缓存数据 Page 的索引。
- PKIndexPageCache: 缓存 Page 的主键索引。
```

2. Metadata Cache

用于加速元数据读取。

```
- SegmentCache: 缓存已打开的 Segment，如索引信息。
- SchemaCache: 缓存 Rowset Schema。
- TabletSchemaCache: 缓存 Tablet Schema。
- CreateTabletRRIdxCache:  缓存 Create Tabelt 索引。
- MowTabletVersionCache: 缓存 Mow Tablet Version。
- MowDeleteBitmapAggCache: 缓存 Mow DeleteBitmap。
```

3. Cloud Cache

云上专用的缓存。

```
- CloudTabletCache: Cloud 上缓存 Tablet。
- CloudTxnDeleteBitmapCache: Cloud 上缓存 DeleteBitmap。
```

4. Inverted Index Cache

加速倒排索引。

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
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
