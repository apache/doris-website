---
{
  "title": "メモリログ解析",
  "language": "ja",
  "description": "be/log/be.INFOのプロセスメモリログは主に2つのカテゴリに分かれています。1つはプロセスメモリステータスログであり、"
}
---
`be/log/be.INFO`のプロセスメモリログは主に2つのカテゴリに分かれています。1つはプロセスメモリサイズとシステムの残り利用可能メモリサイズを含むプロセスメモリステータスログです。もう1つはMemory Trackerによってカウントされたメモリサイズを含む、より詳細なプロセスメモリ統計ログです。

## プロセスメモリステータスログ分析

Doris BEのプロセスメモリステータスは、プロセスメモリが256 MB増加または減少するたびに`log/be.INFO`ログに出力されます。さらに、プロセスメモリが不足している場合、プロセスメモリステータスは他のログと一緒に出力されます。

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 1 35.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```
1. `os physical memory 375.81 GB` は、システム物理メモリ375.81 GBを指します。

2. `process memory used 4.09 GB (= 3.49 GB [vm/rss] - 410.44 MB [tc/jemalloc_cache] + 1 GB [reserved] + 0B [waiting_refresh])`
- 現在、BEプロセスが4.09 GBのメモリを使用していると考えられ、BEプロセスが実際に使用している物理メモリ `vm/rss` は3.49 GBです。
- このうち410.44 MBが `tc/jemalloc_cache` です。このキャッシュ部分は後続の実行プロセスで最初に再利用されるため、ここではBEプロセスメモリには含まれません。
- `reserved` は実行プロセス中に予約されたメモリです。通常、HashTableの構築など大量のメモリを消費する操作を行う前に、メモリ不足によってHashTableの構築プロセスが終了しないよう、HashTableのメモリを事前に予約します。この予約メモリ部分は、実際に割り当てられていない場合でも、BEプロセスメモリに計算されます。
- `waiting_refresh` は、2つのメモリ状態更新の間隔で要求された大きなメモリです。Dorisメモリ状態更新のデフォルト間隔は100msです。2つのメモリ状態更新の間隔での大量のメモリ要求により、メモリが制限を超えた後にメモリGCが適時に検出・トリガーされないことを避けるため、間隔内で要求された大きなメモリはBEプロセスメモリに計算されます。`waiting_refresh` は各メモリ状態更新後に0にクリアされます。

3. `sys available memory 134.41 GB (= 135.41 GB [proc/available] - 1 GB [reserved] - 0B [waiting_refresh])`
- BEプロセスの現在の残り利用可能メモリは134.41 GBで、システムでBEプロセスが利用可能な実際のメモリ `proc/available` は135.41 GBです。
- メモリのうち1GBが予約されているため、BEプロセスの残り利用可能メモリを計算する際は `reserved` を差し引きます。`reserved` と `waiting_refresh` について、`limit 3.01 GB, soft limit 2.71 GB` と `low water mark 3.20 GB, warning water mark 6.40 GB` の詳細については、MemLimitとWaterMarkに関する情報として[Memory limit and watermark calculation method]を参照してください。

## プロセスメモリ統計ログ解析

プロセスの利用可能メモリが不足している場合、BE内のほとんどのメモリ要求はそれを認識し、Memory GCのトリガーやクエリのキャンセルなど、事前に定められたコールバック方法を実行しようとし、プロセスメモリ統計ログを出力します。デフォルトの出力間隔は1秒です。ログは `Process Memory Summary` と `Memory Tracker Summary` の2つの部分に分かれています。現在のプロセスメモリ使用量が期待通りかどうかを確認するには、`be/log/be.INFO` で確認できます。

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
    MemTrackerLimiter Label=sum of all trackers, Type=overview, Limit=-1.00 B(-1 B), Used=114.80 MB(726799124 B), Peak=-1.00 B(-1 B)
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
`Process Memory Summary`はプロセスメモリステータスです。上記の[Process Memory Status Log Analysis]を参照してください。

`Memory Tracker Summary`は、プロセスのMemory Trackerのサマリーで、`Type=overview`と`Type=global`のすべてのMemory Trackerが含まれており、ユーザーが現在のメモリステータスを分析するのに役立ちます。メモリの各部分の意味を分析するには、[Overview](./../overview.md)を参照してください。
