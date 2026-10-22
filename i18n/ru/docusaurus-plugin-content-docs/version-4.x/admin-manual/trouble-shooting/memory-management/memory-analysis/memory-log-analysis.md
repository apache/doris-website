---
{
    "title": "Анализ журналов памяти",
    "language": "ru",
    "description": "Журналы памяти процесса в be/log/be.INFO в основном делятся на две категории. К первой относятся журналы состояния памяти процесса,"
}
---

Журналы памяти процесса в `be/log/be.INFO` в основном делятся на две категории. К первой относятся журналы состояния памяти процесса, содержащие объём используемой процессом памяти и объём оставшейся доступной памяти системы. Ко второй относятся более подробные журналы статистики памяти процесса, содержащие в том числе объём памяти, учтённый Memory Tracker.

## Анализ журнала состояния памяти процесса {#process-memory-status-log-analysis}

Состояние памяти процесса Doris BE записывается в журнал `log/be.INFO` каждый раз, когда объём используемой процессом памяти увеличивается или уменьшается на 256 MB. Кроме того, при нехватке памяти процесса сведения о её состоянии выводятся вместе с другими сообщениями журнала.

```
os physical memory 375.81 GB. process memory used 4.09 GB(= 3.49 GB[vm/rss] - 410.44 MB[tc/jemalloc_cache] + 1 GB[reserved] + 0B[waiting_refresh]), limit 3.01 GB, soft limit 2.71 GB. sys available memory 134.41 GB(= 1 35.41 GB[proc/available] - 1 GB[reserved] - 0B[waiting_refresh]), low water mark 3.20 GB, warning water mark 6.40 GB.
```

1. `os physical memory 375.81 GB` означает, что объём физической памяти системы составляет 375.81 GB.

2. `process memory used 4.09 GB (= 3.49 GB [vm/rss] - 410.44 MB [tc/jemalloc_cache] + 1 GB [reserved] + 0B [waiting_refresh])`
- По текущей оценке процесс BE использует 4.09 GB памяти, а фактический объём физической памяти, используемой процессом BE, `vm/rss` составляет 3.49 GB.
- Из этого объёма 410.44 MB приходится на `tc/jemalloc_cache`. При последующем выполнении этот кэш используется в первую очередь, поэтому здесь он не учитывается в объёме памяти процесса BE.
- `reserved` обозначает память, зарезервированную в ходе выполнения. Обычно перед построением HashTable и другими операциями, требующими большого объёма памяти, память для HashTable резервируется заранее, чтобы избежать прерывания построения HashTable из-за нехватки памяти. Эта зарезервированная память учитывается в объёме памяти процесса BE, даже если она ещё фактически не выделена.
- `waiting_refresh` обозначает память, запрошенную крупными блоками в интервале между двумя обновлениями состояния памяти. По умолчанию Doris обновляет состояние памяти с интервалом 100 мс. Если между двумя обновлениями поступает много запросов на выделение памяти, превышение лимита может остаться незамеченным, и Memory GC не будет запущен вовремя. Поэтому память, запрошенная крупными блоками в этом интервале, учитывается в объёме памяти процесса BE. Значение `waiting_refresh` сбрасывается в 0 после каждого обновления состояния памяти.

3. `sys available memory 134.41 GB (= 135.41 GB [proc/available] - 1 GB [reserved] - 0B [waiting_refresh])`
- Текущий оставшийся объём памяти, доступной процессу BE, составляет 134.41 GB, а фактический объём доступной процессу BE памяти в системе `proc/available` составляет 135.41 GB.
- Из этой памяти 1GB уже зарезервирован, поэтому при расчёте оставшейся доступной памяти процесса BE вычитается `reserved`. Подробнее о `reserved` и `waiting_refresh`, параметрах `limit 3.01 GB, soft limit 2.71 GB` и `low water mark 3.20 GB, warning water mark 6.40 GB`, а также о MemLimit и WaterMark см. [Метод расчёта лимита памяти и пороговых уровней].

## Анализ журнала статистики памяти процесса {#process-memory-statistics-log-analysis}

Когда процессу не хватает доступной памяти, большинство запросов на выделение памяти в BE обнаруживает это и пытается вызвать заранее определённый обработчик, например запустить Memory GC или отменить запрос, а также вывести журнал статистики памяти процесса. По умолчанию интервал вывода составляет 1 с. Журнал состоит из двух частей: `Process Memory Summary` и `Memory Tracker Summary`. Его можно найти в `be/log/be.INFO`, чтобы проверить, соответствует ли текущее использование памяти процессом ожиданиям.

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

`Process Memory Summary` содержит сведения о состоянии памяти процесса. См. раздел [Анализ журнала состояния памяти процесса] выше.

`Memory Tracker Summary` представляет собой сводку Memory Tracker процесса, включающую все Memory Tracker с `Type=overview` и `Type=global`, и помогает пользователям анализировать текущее состояние памяти. Назначение каждой категории памяти описано в разделе [Обзор](./../overview.md).
