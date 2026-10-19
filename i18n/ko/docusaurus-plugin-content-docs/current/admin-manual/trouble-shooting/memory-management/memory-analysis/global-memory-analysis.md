---
{
    "title": "Global Memory 분석",
    "language": "ko",
    "description": "GLobal Memory는 Doris에서 전역적으로 공유되는 메모리로, 주로 Cache와 Metadata를 포함합니다."
}
---

GLobal Memory는 Doris에서 전역적으로 공유되는 메모리로, 주로 Cache와 Metadata를 포함합니다.

## Global Memory 확인 방법 {#global-memory-view-method}

웹 페이지 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global`에서 `type=global`인 모든 Memory Tracker를 확인할 수 있습니다.

![이미지](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

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

일부 Memory Tracker 태그에는 접미사가 붙어 있으며, 각각의 의미는 다음과 같습니다.

- `[size]`는 Cache Tracker가 메모리 사용량을 기록한다는 뜻입니다.

- `[number]`는 Cache Tracker가 캐시된 항목 수를 기록한다는 뜻입니다. 이는 일반적으로 현재 메모리 사용량을 정확하게 집계할 수 없기 때문입니다.

- `(AllocByAllocator)`는 Tracker 값이 Doris Allocator를 통해 추적된다는 뜻입니다.

- `(experimental)`은 해당 Memory Tracker가 아직 실험 단계이며 값이 정확하지 않을 수 있다는 뜻입니다.

## Global Memory 사용량이 많은 경우 {#global-memory-occupies-a-lot}

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

Global Memory Tracker `Label=global, Type=overview`의 값은 `Type=global`과 `Parent Label != DetailsTrackerSet` 조건을 만족하는 모든 Memory Tracker 값의 합계와 같습니다. 여기에는 주로 서로 다른 작업 간에 공유되는 Cache와 Metadata가 포함됩니다.

### Cache 분석 방법 {#cache-analysis-method}

[Doris Cache 메모리 분석](./doris-cache-memory-analysis.md)을 참고하세요.

### Metadata 분석 방법 {#metadata-analysis-method}

[Metadata 메모리 분석](./metadata-memory-analysis.md)을 참고하세요.

### Orphan 분석 방법 {#orphan-analysis-method}

Orphan Memory Tracker 값이 너무 크면 Memory Tracker 통계가 누락되었음을 의미합니다. [Memory Tracker](./../memory-feature/memory-tracker.md)의 [Memory Tracker 통계 누락]에 있는 분석 내용을 참고하세요.
