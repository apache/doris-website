---
{
    "title": "内存日志分析",
    "language": "zh-CN",
    "description": "be/log/be.INFO 中的进程内存日志主要分为两类，一是进程内存状态日志，包括进程内存大小和系统剩余可用内存大小。二是更加详细的进程内存统计日志，包含 Memory Tracker 统计的内存大小。"
}
---

`be/log/be.INFO` 中的进程内存日志主要分为两类，一是进程内存状态日志，包括进程内存大小和系统剩余可用内存大小。二是更加详细的进程内存统计日志，包含 Memory Tracker 统计的内存大小。

## 进程内存状态日志分析

Doris BE 进程内存每次增长或减少 256 MB 都会在 `log/be.INFO` 日志打印一次进程内存状态，另外进程内存不足时，也会随其他日志一起打印进程内存状态。

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```

1. `os physical memory 375.81 GB` 指系统物理内存 375.81 GB。

2. `process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh])`
- 当前我们认为 BE 进程使用了 4.09 GB 内存，实际 BE 进程使用的物理内存 `vm/rss` 是 3.49 GB，
- 其中有 410.44 MB 是 `tc/jemalloc_cache`，这部分 Cache 会在之后执行过程中被优先复用，所以这里不将其算作 BE 进程内存。
- `reserved` 是在执行过程中被预留的内存，通常在构建 HashTable 等会耗费大量内存的操作前会提前预留 HashTable 的内存，确保构建 HashTable 的过程不会因为内存不足而终止，这部分预留的内存被计算在 BE 进程内存中，即使实际上还没有被分配。
- `waiting_refresh` 是两次内存状态刷新的间隔中申请的大内存，Doris 内存状态刷新的间隔默认是 100ms，为避免两次内存状态刷新的间隔中发生大量内存申请，在内存超限后没有及时感知和触发内存 GC，所以间隔中申请的大内存被计算在 BE 进程内存中，每次内存状态刷新后`waiting_refresh`都将清 0，

3. `sys available memory 134.41 GB(= 135.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh])`
- 当前 BE 进程剩余可使用的内存是 134.41 GB，系统中实际可提供给 BE 进程使用的内存 `proc/available` 是 135.41 GB.
- 其中有 1GB 的内存已经被预留，所以在计算 BE 进程剩余可用内存时减去 `reserved`，关于 `reserved` 和 `waiting_refresh` 的介绍参考上面对 BE 进程内存的注解。

4. `limit 3.01 GB, soft limit 2.71 GB` 和 `low water mark 3.20 GB, warning water mark 6.40 GB`，有关 MemLimit 和 WaterMark 的更多介绍见 [内存限制和水位线计算方法]。

## 进程内存统计日志分析

当进程可用内存不足后，BE 大多数位置的内存申请都会感知，尝试做出预定的回调方法，包括触发 Memory GC 或 Cancel 查询等，并打印进程内存统计日志，打印默认间隔是 1s，日志分为两部分 `Process Memory Summary` 和 `Memory Tracker Summary` 两部分，在`be/log/be.INFO` 中可以找到，据此确认当前进程内存使用是否符合预期。

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

`Process Memory Summary` 是进程内存状态，参考上文 [进程内存状态日志分析]。

`Memory Tracker Summary` 是进程 Memory Tracker 汇总，包含所有 `Type=overview` 和 `Type=global` 的 Memory Tracker，帮助使用者分析当时的内存状态，参考 [Overview](./../overview.md) 分析每一部分内存的含义。
