---
{
    "title": "Анализ Global Memory",
    "language": "ru",
    "description": "Global Memory — это общая память Doris, которая в основном включает кэш и метаданные."
}
---

Global Memory — это общая память Doris, которая в основном включает кэш и метаданные.

## Как просмотреть Global Memory {#global-memory-view-method}

На веб-странице `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` отображаются все Memory Tracker с `type=global`.

![изображение](https://github.com/apache/doris/assets/13197424/e0b4a327-5bfb-4dfd-9e1e-bf58a482a456)

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

Некоторые метки Memory Tracker имеют суффиксы со следующим значением:

- `[size]` означает, что Cache Tracker учитывает объём памяти.

- `[number]` означает, что Cache Tracker учитывает количество записей в кэше. Обычно это связано с тем, что объём памяти пока невозможно точно подсчитать.

- `(AllocByAllocator)` означает, что значение Tracker отслеживается с помощью Doris Allocator.

- `(experimental)` означает, что этот Memory Tracker пока является экспериментальным и его значение может быть неточным.

## Global Memory занимает много памяти {#global-memory-occupies-a-lot}

```
MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
```

Значение Global Memory Tracker `Label=global, Type=overview` равно сумме значений всех Memory Tracker с `Type=global` и `Parent Label != DetailsTrackerSet`. В основном сюда входят кэш и метаданные, используемые совместно разными задачами.

### Методика анализа кэша {#cache-analysis-method}

См. [Анализ памяти кэша Doris](./doris-cache-memory-analysis.md)

### Методика анализа метаданных {#metadata-analysis-method}

См. [Анализ памяти метаданных](./metadata-memory-analysis.md)

### Методика анализа Orphan {#orphan-analysis-method}

Если значение Orphan Memory Tracker слишком велико, это означает, что статистика Memory Tracker неполна. См. разбор в разделе [Неполная статистика Memory Tracker] документа [Memory Tracker](./../memory-feature/memory-tracker.md).
