---
{
    "title": "메모리 로그 분석",
    "language": "ko",
    "description": "be/log/be.INFO의 프로세스 메모리 로그는 크게 두 가지로 나뉩니다. 그중 하나는 프로세스 메모리 상태 로그이며,"
}
---

`be/log/be.INFO`의 프로세스 메모리 로그는 크게 두 가지로 나뉩니다. 하나는 프로세스 메모리 크기와 시스템의 남은 가용 메모리 크기를 포함하는 프로세스 메모리 상태 로그입니다. 다른 하나는 Memory Tracker가 집계한 메모리 크기 등 더 자세한 정보를 포함하는 프로세스 메모리 통계 로그입니다.

## 프로세스 메모리 상태 로그 분석 {#process-memory-status-log-analysis}

Doris BE의 프로세스 메모리가 256 MB 증가하거나 감소할 때마다 프로세스 메모리 상태가 `log/be.INFO` 로그에 출력됩니다. 또한 프로세스 메모리가 부족할 때도 다른 로그와 함께 프로세스 메모리 상태가 출력됩니다.

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 1 35.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```

1. `os physical memory 375.81 GB`는 시스템의 물리 메모리가 375.81 GB임을 나타냅니다.

2. `process memory used 4.09 GB (= 3.49 GB [vm/rss] - 410.44 MB [tc/jemalloc_cache] + 1 GB [reserved] + 0B [waiting_refresh])`
- 현재 BE 프로세스가 사용하는 메모리는 4.09 GB로 간주하며, BE 프로세스가 실제로 사용하는 물리 메모리인 `vm/rss`는 3.49 GB입니다.
- 이 중 410.44 MB는 `tc/jemalloc_cache`입니다. 이 캐시는 이후 실행 과정에서 우선적으로 재사용되므로 여기서는 BE 프로세스 메모리에 포함하지 않습니다.
- `reserved`는 실행 과정에서 예약한 메모리입니다. 일반적으로 HashTable 구축처럼 메모리를 많이 사용하는 작업을 수행하기 전에 HashTable에 필요한 메모리를 미리 예약하여 메모리 부족으로 HashTable 구축 과정이 종료되지 않도록 합니다. 이 예약 메모리는 실제로 할당되지 않았더라도 BE 프로세스 메모리에 포함됩니다.
- `waiting_refresh`는 두 번의 메모리 상태 갱신 사이에 요청된 대용량 메모리입니다. Doris의 기본 메모리 상태 갱신 간격은 100ms입니다. 두 번의 메모리 상태 갱신 사이에 메모리 요청이 대량으로 발생하면, 메모리가 제한을 초과해도 이를 제때 감지하지 못해 메모리 GC가 실행되지 않을 수 있습니다. 이를 방지하기 위해 해당 간격에 요청된 대용량 메모리를 BE 프로세스 메모리에 포함합니다. `waiting_refresh`는 메모리 상태가 갱신될 때마다 0으로 초기화됩니다.

3. `sys available memory 134.41 GB (= 135.41 GB [proc/available] - 1 GB [reserved] - 0B [waiting_refresh])`
- 현재 BE 프로세스의 남은 가용 메모리는 134.41 GB이며, 시스템에서 BE 프로세스가 실제로 사용할 수 있는 메모리인 `proc/available`은 135.41 GB입니다.
- 메모리 중 1GB가 예약되어 있으므로 BE 프로세스의 남은 가용 메모리를 계산할 때 `reserved`를 뺍니다. `reserved`와 `waiting_refresh`, `limit 3.01 GB, soft limit 2.71 GB` 및 `low water mark 3.20 GB, warning water mark 6.40 GB`에 대한 설명과 MemLimit 및 WaterMark에 대한 자세한 내용은 [메모리 제한 및 워터마크 계산 방법]을 참고하세요.

## 프로세스 메모리 통계 로그 분석 {#process-memory-statistics-log-analysis}

프로세스의 가용 메모리가 부족하면 BE에서 발생하는 대부분의 메모리 요청이 이를 감지하고, 메모리 GC 실행이나 쿼리 취소 등 미리 지정된 콜백 메서드의 실행을 시도하며 프로세스 메모리 통계 로그를 출력합니다. 기본 출력 간격은 1s입니다. 로그는 `Process Memory Summary`와 `Memory Tracker Summary`의 두 부분으로 나뉩니다. `be/log/be.INFO`에서 이 로그를 찾아 현재 프로세스 메모리 사용량이 예상과 일치하는지 확인할 수 있습니다.

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

`Process Memory Summary`는 프로세스 메모리 상태를 나타냅니다. 위의 [프로세스 메모리 상태 로그 분석]을 참고하세요.

`Memory Tracker Summary`는 프로세스의 Memory Tracker 요약으로, 현재 메모리 상태를 분석할 수 있도록 `Type=overview`와 `Type=global`의 모든 Memory Tracker를 포함합니다. 각 메모리 부분의 의미는 [개요](./../overview.md)를 참고하세요.
