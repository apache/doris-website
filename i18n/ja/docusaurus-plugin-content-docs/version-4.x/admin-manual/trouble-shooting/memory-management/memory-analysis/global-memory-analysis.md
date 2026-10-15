---
{
    "title": "グローバルメモリの分析",
    "language": "ja",
    "description": "グローバルメモリは Doris 全体で共有されるメモリで、主にキャッシュとメタデータが含まれます。"
}
---

グローバルメモリは Doris 全体で共有されるメモリで、主にキャッシュとメタデータが含まれます。

## グローバルメモリの確認方法

Web ページ `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` には、`type=global` のすべての Memory Tracker が表示されます。

![グローバルメモリの Memory Tracker 一覧](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

```
- Orphan: Collects memory that does not know where it belongs, and ideally it is expected to be equal to 0.
- DataPageCache\[size\](AllocByAllocator): The size of the data Page cache.
- IndexPageCache\[size\](AllocByAllocator): The size of the index cache of the data Page.
- PKIndexPageCache\[size\](AllocByAllocator): Primary key index of data Page.
- DetailsTrackerSet: Contains some memory that is not currently tracked accurately. These memories will not be counted in Global memory, including some Cache and metadata memory, etc. By default, only Memory Trackers with Peak Consumption not equal to 0 are displayed, mainly including the following:
- SegmentCache[size]: Caches the memory size of the opened Segment, such as index information.
- SchemaCache[number]: Caches the number of entries of Rowset Schema.
- TabletSchemaCache[number]: Caches the number of entries of Tablet Schema.
- TabletMeta(experimental): Memory size of all Tablet Schema.
- CreateTabletRRIdxCache[number]: Caches the number of entries of create tabelt index.
- PageNoCache: If page cache is turned off, this Memory Trakcer will track the sum of all page memory used by all Queries.
- IOBufBlockMemory: The total IOBuf memory used by BRPC.
- PointQueryLookupConnectionCache[number]: The number of cached Point Query Lookup Connection entries.
- AllMemTableMemory: The total Memtable memory of all loads cached in memory waiting to be flushed.
- MowTabletVersionCache[number]: The number of cached Mow Tablet Version entries.
- MowDeleteBitmapAggCache[size]: The cached Mow DeleteBitmap memory size.
- SegCompaction: The total memory allocated from `Doris Allocator` by all SegCompaction tasks.
- PointQueryExecutor: Some memory shared by all Point Queries.
- BlockCompression: Some memory used in the decompression process shared by all Queries.
- RowIdStorageReader: All Multiget Data requests use memory in RowIdStorageReader.
- SubcolumnsTree: Some memory used by Point Query in SubcolumnsTree.
- S3FileBuffer: Memory allocated by the File Buffer when reading S3.
```

一部の Memory Tracker のタグには、次の意味を持つ接尾辞が付いています。

- `[size]` は、Cache Tracker がメモリサイズを記録することを示します。

- `[number]` は、Cache Tracker がキャッシュされたエントリ数を記録することを示します。通常、現時点ではメモリを正確に集計できないためです。

- `(AllocByAllocator)` は、Tracker の値が Doris Allocator によって追跡されることを示します。

- `(experimental)` は、この Memory Tracker がまだ実験的なもので、値が正確ではない可能性があることを示します。

## グローバルメモリの使用量が多い場合

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

Global Memory Tracker `Label=global, Type=overview` の値は、`Type=global` かつ `Parent Label != DetailsTrackerSet` であるすべての Memory Tracker の合計に等しくなります。主に、異なるタスク間で共有されるキャッシュとメタデータが含まれます。

### キャッシュの分析方法

[Doris のキャッシュメモリ分析](./doris-cache-memory-analysis.md)を参照してください。

### メタデータの分析方法

[メタデータのメモリ分析](./metadata-memory-analysis.md)を参照してください。

### Orphan の分析方法

Orphan Memory Tracker の値が大きすぎる場合、Memory Tracker の統計情報が欠落していることを意味します。[Memory Tracker](./../memory-feature/memory-tracker.md) の「Memory Tracker の統計情報の欠落」に関する分析を参照してください。
