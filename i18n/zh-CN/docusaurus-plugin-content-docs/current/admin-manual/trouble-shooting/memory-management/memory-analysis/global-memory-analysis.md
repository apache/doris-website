---
{
    "title": "全局内存分析",
    "language": "zh-CN",
    "description": "GLobal Memory 是 Doris 全局共享的内存，主要包括 Cache 和 Metadata。"
}
---

GLobal Memory 是 Doris 全局共享的内存，主要包括 Cache 和 Metadata。

## Global Memory 查看方法

Web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` 展示 `type=global` 的所有 Memory Tracker。

![image](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

```
- Orphan: 收集不知所属的内存，理想情况下预期等于0。
- DataPageCache\[size\](AllocByAllocator): 数据 Page 缓存的大小。
- IndexPageCache\[size\](AllocByAllocator): 数据 Page 的索引缓存的大小。
- PKIndexPageCache\[size\](AllocByAllocator): 数据 Page 的主键索引。
- DetailsTrackerSet: 包含一些当前没有被准确跟踪的内存，这些内存不会被算在 Global 内存中，包括部分 Cache 和 元数据内存等，默认只展示 Peak Consumption 不等于 0 的 Memory Tracker，主要包括下面这些：
    - SegmentCache[size]: 缓存已打开的 Segment 的内存大小，如索引信息。
    - SchemaCache[number]: 缓存 Rowset Schema 的条目数。
    - TabletSchemaCache[number]: 缓存 Tablet Schema 的条目数。
    - TabletMeta(experimental): 所有 Tablet Schema 的内存大小。
    - CreateTabletRRIdxCache[number]: 缓存 create tabelt 索引的条目数。
    - PageNoCache: 如果关闭了 page cache, 这个 Memory Trakcer 将跟踪所有 Query 使用的所有 page 内存总和。
    - IOBufBlockMemory: BRPC 使用的 IOBuf 内存总和。
    - PointQueryLookupConnectionCache[number]: 缓存的 Point Query Lookup Connection 条目数。
    - AllMemTableMemory: 所有导入在内存中缓存等待下刷的 Memtable 内存总和。
    - MowTabletVersionCache[number]: 缓存的 Mow Tablet Version 条目数。
    - MowDeleteBitmapAggCache[size]: 缓存的 Mow DeleteBitmap 内存大小。
- SegCompaction: 所有 SegCompaction 任务从 `Doris Allocator` 分配的内存总和。
- PointQueryExecutor: 所有 Point Query 共享的一些内存。
- BlockCompression: 所有 Query 共享的一些解压缩过程中使用的内存。
- RowIdStorageReader: 所有 Multiget Data 请求在 RowIdStorageReader 中使用的内存。
- SubcolumnsTree: Point Query 在 SubcolumnsTree 中使用的一些内存。
- S3FileBuffer: 读取 S3 时 File Buffer 分配的内存。
```

其中部分 Memory Tracker 标记有一些后缀，含义为：

- `[size]` 意味着 Cache Tracker 记录的是内存大小。

- `[number]` 意味着 Cache Tracker 记录的是缓存的条目数，这通常是因为目前无法准确统计内存。

- `(AllocByAllocator)` 意味着 Tracker 的值由 Doris Allocator 跟踪。

- `(experimental)` 意味着这个 Memory Tracker 还处于实验中，值可能不准确。

## Global Memory 占用多

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

Global Memory Tracker `Label=global, Type=overview` 的值等于所有 `Type=global` 且 `Parent Label != DetailsTrackerSet` 的 Memory Tracker 之和，主要包括 Cache 和元数据等在不同任务间共享的内存。

### Cache 分析方法

参考 [Cache 内存分析](./doris-cache-memory-analysis.md) 

### Metadata 分析方法

参考 [Metadata 内存分析](./metadata-memory-analysis.md) 

### Orphan 分析方法

如果 Orphan Memory Tracker 值过大意味着 Memory Tracker 统计缺失，参考 [内存跟踪器](./../memory-feature/memory-tracker.md) 中 [Memory Tracker 统计缺失] 中的分析。
