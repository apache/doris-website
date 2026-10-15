---
{
    "title": "メモリログの分析",
    "language": "ja",
    "description": "be/log/be.INFO のプロセスメモリログは、主に二種類に分けられます。一つはプロセスメモリ状態のログです。"
}
---

`be/log/be.INFO` のプロセスメモリログは、主に二種類に分けられます。一つはプロセスメモリのサイズとシステムに残っている使用可能なメモリのサイズを示すプロセスメモリ状態のログです。もう一つは、Memory Tracker が集計したメモリサイズを含む、より詳細なプロセスメモリ統計のログです。

## プロセスメモリ状態ログの分析

Doris BE のプロセスメモリが 256 MB 増減するたびに、プロセスメモリの状態が `log/be.INFO` ログに出力されます。また、プロセスメモリが不足したときにも、ほかのログとともにプロセスメモリの状態が出力されます。

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 1 35.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```

1. `os physical memory 375.81 GB` は、システムの物理メモリが 375.81 GB であることを示します。

2. `process memory used 4.09 GB (= 3.49 GB [vm/rss] - 410.44 MB [tc/jemalloc_cache] + 1 GB [reserved] + 0B [waiting_refresh])`
- 現在の BE プロセスのメモリ使用量は 4.09 GB とみなされます。BE プロセスが実際に使用している物理メモリ `vm/rss` は 3.49 GB です。
- そのうち 410.44 MB は `tc/jemalloc_cache` です。このキャッシュは後続の処理で優先的に再利用されるため、ここでは BE プロセスのメモリ使用量に含めません。
- `reserved` は、処理中に予約されたメモリです。通常、HashTable の構築など大量のメモリを消費する操作の前に、メモリ不足で HashTable の構築が中断されないよう、その分のメモリをあらかじめ予約します。この予約済みメモリは、実際にはまだ割り当てられていなくても、BE プロセスのメモリ使用量に含めます。
- `waiting_refresh` は、二回のメモリ状態の更新の間に要求された大量のメモリです。Doris のメモリ状態の更新間隔は、デフォルトで 100ms です。この間に大量のメモリが要求され、メモリ使用量が制限を超えてもメモリ GC の必要性が適時に検知されず、GC が起動されない事態を避けるため、この間の要求量を BE プロセスのメモリ使用量に含めます。`waiting_refresh` は、メモリ状態が更新されるたびに 0 にリセットされます。

3. `sys available memory 134.41 GB (= 135.41 GB [proc/available] - 1 GB [reserved] - 0B [waiting_refresh])`
- 現在、BE プロセスが使用できる残りのメモリは 134.41 GB です。システム内で BE プロセスが実際に使用できるメモリ `proc/available` は 135.41 GB です。
- メモリのうち 1GB は予約済みのため、BE プロセスが使用できる残りのメモリを計算するときは `reserved` を差し引きます。`reserved` と `waiting_refresh`、および `limit 3.01 GB, soft limit 2.71 GB` と `low water mark 3.20 GB, warning water mark 6.40 GB` の説明を含む MemLimit と WaterMark の詳細については、[メモリ制限とウォーターマークの計算方法]を参照してください。

## プロセスメモリ統計ログの分析

プロセスが使用できるメモリが不足すると、BE 内のほとんどのメモリ要求はそれを検知し、Memory GC の起動やクエリのキャンセルなど、あらかじめ定められたコールバック処理を試み、プロセスメモリ統計ログを出力します。デフォルトの出力間隔は 1s です。このログは `Process Memory Summary` と `Memory Tracker Summary` の二つの部分に分かれています。`be/log/be.INFO` でこのログを確認すると、現在のプロセスメモリ使用量が想定どおりかどうかを判断できます。

```sql
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
Memory Tracker Summary:
    MemTrackerLimiter Label=other, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=schema_change, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=compaction, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
    MemTrackerLimiter Label=global, Type=overview, Limit=-1.00 B(-1 B), Used=199.37 MB(209053204 B), Peak=199.37 MB(209053204 B)
    MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=sum of all trackers, Type=overview, Limit=-1.00 B(-1 B), Used=693.14 MB(726799124 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=process resident memory, Type=overview, Limit=-1.00 B(-1 B), Used=3.49 GB(3743289344 B), Peak=3.49 GB(3743289344 B)
    MemTrackerLimiter Label=reserved_memory, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=-1.00 B(-1 B)
    MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
    MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=DetailsTrackerSet, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTracker Label=IOBufBlockMemory, Parent Label=DetailsTrackerSet, Used=1.41 MB(1474560 B), Peak=1.41 MB(1474560 B)
    MemTracker Label=SegmentCache[size], Parent Label=DetailsTrackerSet, Used=1.64 MB(1720543 B), Peak=18.78 MB(19691997 B)
    MemTracker Label=SchemaCache[number], Parent Label=DetailsTrackerSet, Used=9.21 KB(9428 B), Peak=9.21 KB(9428 B)
    MemTracker Label=TabletSchemaCache[number], Parent Label=DetailsTrackerSet, Used=9.29 MB(9738798 B), Peak=9.29 MB(9738798 B)
    MemTracker Label=TabletMeta(experimental), Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
    MemTracker Label=RuntimeFilterMergeControllerEntity(experimental), Parent Label=DetailsTrackerSet, Used=32.00 B(32 B), Peak=32.00 B(32 B)
    MemTrackerLimiter Label=SegCompaction, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=PointQueryExecutor, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=BlockCompression, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=RowIdStorageReader, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=SubcolumnsTree, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=S3FileBuffer, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=DataPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=198.70 MB(208357157 B), Peak=198.73 MB(208381892 B)
    MemTrackerLimiter Label=IndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=679.73 KB(696047 B), Peak=679.73 KB(696047 B)
    MemTrackerLimiter Label=PKIndexPageCache[size](AllocByAllocator), Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=Query#Id=529e3cb37dff464c-93bd9eafa8944ea6, Type=query, Limit=2.00 GB(2147483648 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
    MemTrackerLimiter Label=MemTableTrackerSet, Type=load, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTrackerLimiter Label=SnapshotManager, Type=other, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
    MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=0(0 B), Peak=0(0 B)
```

`Process Memory Summary` はプロセスメモリの状態を示します。上記の[プロセスメモリ状態ログの分析]を参照してください。

`Memory Tracker Summary` はプロセスの Memory Tracker の概要です。`Type=overview` と `Type=global` のすべての Memory Tracker が含まれ、現在のメモリ状態を分析する際に役立ちます。各メモリ項目の意味を分析するには、[概要](./../overview.md)を参照してください。
