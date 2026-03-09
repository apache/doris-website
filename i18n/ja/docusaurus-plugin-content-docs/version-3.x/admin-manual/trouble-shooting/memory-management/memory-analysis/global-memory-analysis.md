---
{
  "title": "グローバルメモリ解析",
  "language": "ja",
  "description": "Global Memoryは、Dorisのグローバルに共有されるメモリであり、主にCacheとMetadataが含まれます。"
}
---
GLobal MemoryはDorisのグローバル共有メモリで、主にCacheとMetadataが含まれます。

## Global Memory表示方法

Webページ`http://{be_host}:{be_web_server_port}/mem_tracker?type=global`は、`type=global`のすべてのMemory Trackerを表示します。

![image](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

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
Memory Trackerタグの一部には接尾辞があり、それぞれ以下の意味を持ちます：

- `[size]`は、Cache Trackerがメモリサイズを記録することを意味します。

- `[number]`は、Cache Trackerがキャッシュされたエントリの数を記録することを意味し、通常は現在メモリを正確にカウントできないためです。

- `(AllocByAllocator)`は、Tracker値がDoris Allocatorによって追跡されることを意味します。

- `(experimental)`は、このMemory Trackerがまだ実験的であり、値が正確でない可能性があることを意味します。

## Globalメモリが大量を占有している場合

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```
Global Memory Tracker `Label=global, Type=overview`の値は、`Type=global`かつ`Parent Label != DetailsTrackerSet`のすべてのMemory Trackerの合計に等しく、主に異なるタスク間で共有されるCacheとmetadataを含みます。

### Cache分析方法

[Doris Cache Memory Analysis](./doris-cache-memory-analysis.md)を参照してください。

### Metadata分析方法

[Metadata Memory Analysis](./metadata-memory-analysis.md)を参照してください。

### Orphan分析方法

Orphan Memory Trackerの値が大きすぎる場合、Memory Trackerの統計が不足していることを意味します。[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]の分析を参照してください。
